
import { randomUUID } from "crypto";
import { Wallet } from "../../models/wallet.model";
import { Transaction } from "../../models/transaction.model";
import { transferService, NombaTransferError } from "../main/transfer.service";
import { awardXPoints } from "../main/xpoints.service";
import { AppError } from "../../utils/response.utils";
import mongoose from "mongoose";

interface ExecuteTransferInput {
  userId: mongoose.Types.ObjectId | string;
  amount: number;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  narration?: string;
}

export async function executeTransfer(input: ExecuteTransferInput) {
  const { userId, amount, accountNumber, accountName, bankCode, narration } = input;
  const merchantTxRef = `TX-${randomUUID()}`;

  const wallet = await Wallet.findOneAndUpdate(
    { userId, status: "active", availableBalance: { $gte: amount } },
    { $inc: { availableBalance: -amount } },
    { new: true }
  );

  if (!wallet) {
    const exists = await Wallet.findOne({ userId });
    if (!exists) throw new AppError("Wallet not found", 404);
    if (exists.status !== "active") throw new AppError("Wallet is not active", 403);
    throw new AppError("Insufficient balance", 400);
  }

  const transaction = await Transaction.create({
    userId,
    walletId: wallet._id,
    type: "debit",
    amount,
    status: "pending",
    reference: merchantTxRef,
    description: narration || `Transfer to ${accountName}`,
  });

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

    await Transaction.findByIdAndUpdate(transaction._id, { status: "success" });
    await awardXPoints(userId.toString(), amount, "spend");

    return { success: true, message: "Transfer successful", data: result };
  } catch (error) {
    await Wallet.findByIdAndUpdate(wallet._id, { $inc: { availableBalance: amount } });
    await Transaction.findByIdAndUpdate(transaction._id, { status: "failed" });

    const nombaError = error as NombaTransferError;
    throw new AppError(nombaError.description || nombaError.message || "Transfer failed", 502);
  }
}