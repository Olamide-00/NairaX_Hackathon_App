import { Request, Response } from "express";
import { Wallet } from "../models/wallet.model";
import { Transaction } from "../models/transaction.model";

export const nombaWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const payload = req.body;

    console.log("NOMBA WEBHOOK:", JSON.stringify(payload, null, 2));

    const event = payload.event;
    const data = payload.data;

    /*
    ==============================
    PAYMENT SUCCESS
    Money entering wallet
    ==============================
    */
    if (event === "payment_success") {
      const accountNumber = data.accountNumber;
      const amount = Number(data.amount);

      // Atomic — no race condition
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
        reference: data.reference,
        description: "Wallet funding",
      });
    }

    /*
    ==============================
    PAYOUT SUCCESS
    Transfer confirmed — settle balance
    ==============================
    */
    if (event === "payout_success") {
      const merchantTxRef = data.merchantTxRef;

      console.log("PAYOUT SUCCESS:", merchantTxRef);

      const transaction = await Transaction.findOne({
        reference: merchantTxRef,
      });

      if (transaction) {
        // availableBalance was already deducted at initiation in makeTransfer
        // now deduct balance to reflect confirmed settlement
        await Wallet.findByIdAndUpdate(transaction.walletId, {
          $inc: { balance: -transaction.amount },
        });

        await Transaction.findOneAndUpdate(
          { reference: merchantTxRef },
          { status: "success" }
        );
      }
    }

    /*
    ==============================
    PAYOUT FAILED / REFUND
    Return reserved money
    ==============================
    */
    if (event === "payout_failed" || event === "payout_refund") {
      const merchantTxRef = data.merchantTxRef;

      const transaction = await Transaction.findOne({
        reference: merchantTxRef,
      });

      if (transaction) {
        // Refund the reserved availableBalance
        await Wallet.findByIdAndUpdate(transaction.walletId, {
          $inc: { availableBalance: transaction.amount },
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