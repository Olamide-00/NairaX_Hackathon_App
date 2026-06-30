import { Request, Response } from "express";
import { randomUUID } from "crypto";

import { Wallet } from "../../models/wallet.model";
import { User } from "../../models/user.model";

import {
  nombaService,
  NombaProviderError,
  NombaAccountData,
  NombaCreateVirtualAccountPayload,
} from "../../services/main/wallet.service";

import { accountSetupRequestSchema } from "../../validations/wallet.schema";
import { withRetry, RetryError } from "../../utils/retryLogic.utils";

export const setupAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const userId = req.user._id.toString();

    if (!req.user.isVerified) {
      res.status(403).json({
        success: false,
        message: "Verify your account first",
      });
      return;
    }

    const exists = await Wallet.findOne({ userId });

    if (exists) {
      res.status(409).json({
        success: false,
        message: "Wallet already exists",
      });
      return;
    }

    const parsed = accountSetupRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(422).json({
        success: false,
        errors: parsed.error.flatten(),
      });
      return;
    }

    const { accountName, currency, bvn, pin, age, gender } = parsed.data;

    const accountRef = `${userId}-${randomUUID()}`;

 
    const nombaPayload: NombaCreateVirtualAccountPayload = {
      accountRef,
      accountName,
      currency,
      ...(bvn && { bvn }),
    };

    let nombaData: NombaAccountData;

    try {
      nombaData = await withRetry(
        () => nombaService.createVirtualAccount(nombaPayload),
        {
          maxAttempts: 3,
          baseDelayMs: 200,
          maxDelayMs: 5000,
          onRetry: (error, attempt, delayMs) => {
            console.warn(
              `Nomba virtual account creation attempt ${attempt} failed, retrying in ${delayMs}ms`,
              error
            );
          },
        }
      );
    } catch (error) {
      if (error instanceof NombaProviderError) {
        res.status(422).json({
          success: false,
          message: "Nomba error",
          details: error.description,
        });
        return;
      }

      if (error instanceof RetryError) {
        res.status(502).json({
          success: false,
          message: "Wallet creation failed after multiple attempts, please try again",
        });
        return;
      }

      throw error;
    }

    // Save age and gender to user model
    await User.findByIdAndUpdate(userId, { age, gender });

    // Create wallet 
    const wallet = await Wallet.create({
      userId,
      provider: "nomba",
      accountHolderId: nombaData.accountHolderId,
      accountRef,
      accountName,
      bankName: nombaData.bankName,
      bankAccountNumber: nombaData.bankAccountNumber,
      bankAccountName: nombaData.bankAccountName,
      currency,
      balance: 0,
      availableBalance: 0,
      pin,
    });

    res.status(201).json({
      success: true,
      message: "Wallet created",
      data: {
        id: wallet._id,
        bank: wallet.bankName,
        accountNumber: wallet.bankAccountNumber,
        accountName: wallet.bankAccountName,
        currency: wallet.currency,
        balance: wallet.balance,
        availableBalance: wallet.availableBalance,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Wallet setup failed",
    });
  }
};