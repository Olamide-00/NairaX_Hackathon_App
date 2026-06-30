import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { customAlphabet } from "nanoid";

import { AjoFund } from "../../models/ajoFund.model";
import { AjoFundContribution } from "../../models/ajofundContribution.model";
import { Wallet } from "../../models/wallet.model";
import { Transaction } from "../../models/transaction.model";

import {
  createFundSchema,
  joinFundSchema,
  contributeSchema,
} from "../../validations/ajoFund.schema";

import { checkAndSettleFund } from "../../services/main/ajoFund.service";

const generateInviteCode = customAlphabet(
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
  6
);

// ─── CREATE ────────────────────────────────────────────────────────────────

export const createFund = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const parsed = createFundSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(422).json({
        success: false,
        errors: parsed.error.flatten(),
      });
      return;
    }

    const { title, description, targetAmount, visibility, category, deadline } =
      parsed.data;

    const fund = await AjoFund.create({
      creatorId: req.user._id,
      title,
      description,
      targetAmount,
      visibility,
      category,
      deadline: new Date(deadline),
      amountRaised: 0,
      joinedUsers: [req.user._id], // creator is auto-joined
      ...(visibility === "private" && {
        inviteCode: generateInviteCode(),
      }),
    });

    res.status(201).json({
      success: true,
      message: "AjoFund created",
      data: fund,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create AjoFund",
    });
  }
};

// ─── JOIN (private funds only) ──────────────────────────────────────────────

export const joinFund = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const parsed = joinFundSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(422).json({
        success: false,
        errors: parsed.error.flatten(),
      });
      return;
    }

    const { inviteCode } = parsed.data;

    const fund = await AjoFund.findOne({ inviteCode });

    if (!fund) {
      res.status(404).json({ success: false, message: "Invalid invite code" });
      return;
    }

    if (fund.status !== "active") {
      res.status(400).json({ success: false, message: "This AjoFund is no longer active" });
      return;
    }

    const alreadyJoined = fund.joinedUsers.some(
      (id) => id.toString() === req.user!._id.toString()
    );

    if (alreadyJoined) {
      res.status(200).json({
        success: true,
        message: "Already joined",
        data: fund,
      });
      return;
    }

    fund.joinedUsers.push(req.user._id);
    await fund.save();

    res.status(200).json({
      success: true,
      message: "Joined AjoFund",
      data: fund,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to join AjoFund",
    });
  }
};

// ─── CONTRIBUTE / PAY ────────────────────────────────────────────────────────

export const contributeToFund = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { fundId } = req.params;

    const parsed = contributeSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(422).json({
        success: false,
        errors: parsed.error.flatten(),
      });
      return;
    }

    const { amount } = parsed.data;

    const fund = await AjoFund.findById(fundId);

    if (!fund) {
      res.status(404).json({ success: false, message: "AjoFund not found" });
      return;
    }

    if (fund.status !== "active") {
      res.status(400).json({ success: false, message: "This AjoFund is closed" });
      return;
    }

    // Private funds — only joined users can contribute
    if (fund.visibility === "private") {
      const isJoined = fund.joinedUsers.some(
        (id) => id.toString() === req.user!._id.toString()
      );

      if (!isJoined) {
        res.status(403).json({
          success: false,
          message: "Join this AjoFund with the invite code before contributing",
        });
        return;
      }
    }

    const reference = `AJO-CONTRIB-${randomUUID()}`;

    // Step 1: Atomic deduction from contributor's wallet — no race condition
    const contributorWallet = await Wallet.findOneAndUpdate(
      {
        userId: req.user._id,
        status: "active",
        availableBalance: { $gte: amount },
      },
      { $inc: { availableBalance: -amount, balance: -amount } },
      { new: true }
    );

    if (!contributorWallet) {
      res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
      return;
    }

    // Step 2: Record contribution
    await AjoFundContribution.create({
      fundId: fund._id,
      userId: req.user._id,
      amount,
      reference,
    });

    // Step 3: Log as a debit transaction in the user's main history
    await Transaction.create({
      userId: req.user._id,
      walletId: contributorWallet._id,
      type: "debit",
      amount,
      status: "success",
      reference,
      description: `AjoFund contribution — "${fund.title}"`,
    });

    // Step 4: Increment fund's raised amount atomically
    const updatedFund = await AjoFund.findByIdAndUpdate(
      fund._id,
      { $inc: { amountRaised: amount } },
      { new: true }
    );

    // Step 5: Auto-join contributor if not already joined (public funds)
    if (updatedFund && !updatedFund.joinedUsers.some(
      (id) => id.toString() === req.user!._id.toString()
    )) {
      updatedFund.joinedUsers.push(req.user._id);
      await updatedFund.save();
    }

    // Step 6: Check if goal reached — settle immediately if so
    const finalFund = await checkAndSettleFund(fund._id.toString());

    res.status(201).json({
      success: true,
      message:
        finalFund?.status === "completed"
          ? "Contribution successful — AjoFund goal reached and payout sent!"
          : "Contribution successful",
      data: {
        fund: finalFund,
        contributionAmount: amount,
        reference,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Contribution failed",
    });
  }
};

// ─── FETCH PUBLIC FUNDS ──────────────────────────────────────────────────────

export const getPublicFunds = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      visibility: "public",
      status: "active",
    };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const [funds, total] = await Promise.all([
      AjoFund.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("creatorId", "firstName lastName"),
      AjoFund.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: funds,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch AjoFunds",
    });
  }
};

// ─── FETCH SINGLE FUND + LEADERBOARD ─────────────────────────────────────────

export const getFundById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { fundId } = req.params;

    const fund = await AjoFund.findById(fundId).populate(
      "creatorId",
      "firstName lastName"
    );

    if (!fund) {
      res.status(404).json({ success: false, message: "AjoFund not found" });
      return;
    }

    // Private funds — only visible to joined users
    if (fund.visibility === "private") {
      const isJoined = fund.joinedUsers.some(
        (id) => id.toString() === req.user!._id.toString()
      );

      if (!isJoined) {
        res.status(403).json({
          success: false,
          message: "This AjoFund is private — join with an invite code",
        });
        return;
      }
    }

    // Leaderboard — highest contributor first, aggregated per user
    const leaderboard = await AjoFundContribution.aggregate([
      { $match: { fundId: fund._id } },
      {
        $group: {
          _id: "$userId",
          totalContributed: { $sum: "$amount" },
        },
      },
      { $sort: { totalContributed: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          totalContributed: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        fund,
        leaderboard,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch AjoFund",
    });
  }
};

// ─── FETCH MY FUNDS (created + joined) ───────────────────────────────────────

export const getMyFunds = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const funds = await AjoFund.find({
      joinedUsers: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: funds,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your AjoFunds",
    });
  }
};

// ─── FETCH CONTRIBUTION HISTORY FOR A FUND ───────────────────────────────────

export const getFundContributions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { fundId } = req.params;

    const fund = await AjoFund.findById(fundId);

    if (!fund) {
      res.status(404).json({ success: false, message: "AjoFund not found" });
      return;
    }

    if (fund.visibility === "private") {
      const isJoined = fund.joinedUsers.some(
        (id) => id.toString() === req.user!._id.toString()
      );

      if (!isJoined) {
        res.status(403).json({
          success: false,
          message: "This AjoFund is private",
        });
        return;
      }
    }

    const contributions = await AjoFundContribution.find({ fundId })
      .sort({ createdAt: -1 })
      .populate("userId", "firstName lastName");

    res.status(200).json({
      success: true,
      data: contributions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contribution history",
    });
  }
};