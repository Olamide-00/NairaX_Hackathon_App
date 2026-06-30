import { Request, Response } from "express";
import { Wallet } from "../../models/wallet.model";
import { Transaction } from "../../models/transaction.model";
import { awardXPoints } from "../../services/main/xpoints.service";

export const nombaWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const payload = req.body;

    console.log("NOMBA WEBHOOK:", JSON.stringify(payload, null, 2));

    const event = payload.event_type;
    const data = payload.data;
    const transaction = data?.transaction;
    const customer = data?.customer;

  
    if (event === "payment_success") {
      const accountNumber = transaction?.aliasAccountNumber;
      const amount = Number(transaction?.transactionAmount);
      const reference = transaction?.transactionId;

      if (!accountNumber || !amount || !reference) {
        console.warn("payment_success missing required fields", payload);
        res.status(400).json({ success: false, message: "Malformed payload" });
        return;
      }

    
      const existing = await Transaction.findOne({ reference });

      if (existing) {
        res.json({ success: true, message: "Already processed" });
        return;
      }

      const wallet = await Wallet.findOneAndUpdate(
        { bankAccountNumber: accountNumber },
        { $inc: { balance: amount, availableBalance: amount } },
        { new: true }
      );

      if (!wallet) {
        res.status(404).json({ message: "Wallet not found" });
        return;
      }

      await Transaction.create({
        userId: wallet.userId,
        walletId: wallet._id,
        type: "credit",
        amount,
        status: "success",
        reference,
        description: `Wallet funding from ${customer?.senderName || "unknown sender"}`,
      });

      await awardXPoints(wallet.userId.toString(), amount, "receive");
    }

  
    if (event === "payout_success") {
      const merchantTxRef = transaction?.merchantTxRef;

      console.log("PAYOUT SUCCESS:", merchantTxRef);

      if (!merchantTxRef) {
        console.warn("payout_success missing merchantTxRef", payload);
        res.status(400).json({ success: false, message: "Malformed payload" });
        return;
      }

      const existingTransaction = await Transaction.findOne({
        reference: merchantTxRef,
      });

      if (existingTransaction && existingTransaction.status !== "success") {
        await Wallet.findByIdAndUpdate(existingTransaction.walletId, {
          $inc: { balance: -existingTransaction.amount },
        });

        await Transaction.findOneAndUpdate(
          { reference: merchantTxRef },
          { status: "success" }
        );
      }
    }

  
    if (event === "payout_failed" || event === "payout_refund") {
      const merchantTxRef = transaction?.merchantTxRef;

      if (!merchantTxRef) {
        console.warn(`${event} missing merchantTxRef`, payload);
        res.status(400).json({ success: false, message: "Malformed payload" });
        return;
      }

      const existingTransaction = await Transaction.findOne({
        reference: merchantTxRef,
      });

      if (existingTransaction && existingTransaction.status !== "failed") {
        await Wallet.findByIdAndUpdate(existingTransaction.walletId, {
          $inc: { availableBalance: existingTransaction.amount },
        });

        await Transaction.findOneAndUpdate(
          { reference: merchantTxRef },
          { status: "failed" }
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.log("NOMBA WEBHOOK ERROR:", error);
    res.status(500).json({ success: false });
  }
};