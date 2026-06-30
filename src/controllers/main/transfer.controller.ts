import { Request, Response } from "express";
import { randomUUID } from "crypto";
import {
  transferService,
  NombaTransferError,
} from "../../services/main/transfer.service";
import { Wallet } from "../../models/wallet.model";
import { Transaction } from "../../models/transaction.model";
import { catchAsync } from "../../utils/response.utils";
import { AppError } from "../../utils/response.utils";


export const getBanks = catchAsync(async (
  req: Request,
  res: Response
): Promise<void> => {
  const banks = await transferService.getBanks();

  res.status(200).json({
    success: true,
    count: banks.length,
    data: banks,
  });
});


export const lookupAccount = catchAsync(async (
  req: Request,
  res: Response
): Promise<void> => {
  const { accountNumber, bankCode } = req.body;

  const account = await transferService.lookupAccount(
    accountNumber,
    bankCode
  );

  res.status(200).json({
    success: true,
    data: account,
  });
});


export const makeTransfer = catchAsync(async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  const { amount, accountNumber, accountName, bankCode, narration } = req.body;

  const merchantTxRef = `TX-${randomUUID()}`;

  // Step 1: Atomic balance check + availableBalance deduction
  // findOneAndUpdate returns null if balance is insufficient — no race condition
  const wallet = await Wallet.findOneAndUpdate(
    {
      userId: req.user._id,
      status: "active",
      availableBalance: { $gte: amount },
    },
    { $inc: { availableBalance: -amount } },
    { new: true }
  );

  if (!wallet) {
    const exists = await Wallet.findOne({ userId: req.user._id });

    if (!exists) {
      throw new AppError("Wallet not found", 404);
    }

    if (exists.status !== "active") {
      throw new AppError("Wallet is not active", 403);
    }

    throw new AppError("Insufficient balance", 400);
  }

  // Step 2: Create pending transaction record
  const transaction = await Transaction.create({
    userId: req.user._id,
    walletId: wallet._id,
    type: "debit",
    amount,
    status: "pending",
    reference: merchantTxRef,
    description: narration || `Transfer to ${accountName}`,
  });

  // Step 3: Call Nomba
  try {
    const result = await transferService.transfer({
      amount,
      accountNumber,
      accountName,
      bankCode,
      merchantTxRef,
      senderName: "NairaX",
      narration,
    });

    // Step 4a: Nomba accepted the transfer
    // DO NOT deduct balance here — payout_success webhook handles that exclusively
    await Transaction.findByIdAndUpdate(transaction._id, {
      status: "success",
    });

    res.status(201).json({
      success: true,
      message: "Transfer successful",
      data: result,
    });
  } catch (error) {
    // Step 4b: Nomba rejected — refund the reserved availableBalance
    // DO NOT touch balance — it was never deducted
    await Wallet.findByIdAndUpdate(wallet._id, {
      $inc: { availableBalance: amount },
    });

    await Transaction.findByIdAndUpdate(transaction._id, {
      status: "failed",
    });

    const nombaError = error as NombaTransferError;

    res.status(502).json({
      success: false,
      message: "Transfer failed",
      reason: nombaError.description || nombaError.message,
    });
  }
});