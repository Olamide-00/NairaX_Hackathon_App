import { Request, Response } from "express";
import { randomUUID } from "crypto";
import {
  transferService,
} from "../../services/main/transfer.service";
import { catchAsync } from "../../utils/response.utils";
import { AppError } from "../../utils/response.utils";
import { executeTransfer } from "../../services/ai/transferOrch.ai";


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




//make transfer
export const makeTransfer = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError("Unauthorized", 401);

  const { amount, accountNumber, accountName, bankCode, narration } = req.body;

  const result = await executeTransfer({
    userId: req.user._id,
    amount,
    accountNumber,
    accountName,
    bankCode,
    narration,
  });

  res.status(201).json(result);
});