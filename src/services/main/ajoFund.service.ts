import { AjoFund, IAjoFund } from "../../models/ajoFund.model";
import { Wallet } from "../../models/wallet.model";
import { Transaction } from "../../models/transaction.model";
import { randomUUID } from "crypto";

/**
 * Settles a fund — credits creator wallet and closes the fund.
 * Triggered when amountRaised >= targetAmount OR deadline has passed.
 */
export async function settleFund(fund: IAjoFund): Promise<void> {
  if (fund.status !== "active") return; // already settled

  const creatorWallet = await Wallet.findOne({ userId: fund.creatorId });

  if (!creatorWallet) {
    console.error(`Settlement failed — wallet not found for creator ${fund.creatorId}`);
    return;
  }

  const payoutAmount = fund.amountRaised;
  const isGoalReached = fund.amountRaised >= fund.targetAmount;

  if (payoutAmount > 0) {
    // Credit creator wallet atomically
    await Wallet.findByIdAndUpdate(creatorWallet._id, {
      $inc: { balance: payoutAmount, availableBalance: payoutAmount },
    });

    await Transaction.create({
      userId: fund.creatorId,
      walletId: creatorWallet._id,
      type: "credit",
      amount: payoutAmount,
      status: "success",
      reference: `AJO-PAYOUT-${randomUUID()}`,
      description: `AjoFund payout — "${fund.title}"`,
    });
  }

  fund.status = isGoalReached ? "completed" : "expired";
  await fund.save();
}

/**
 * Checks a single fund and settles it if goal is reached or deadline has passed.
 * Call this after every contribution, and via a scheduled job for deadline sweeps.
 */
export async function checkAndSettleFund(fundId: string): Promise<IAjoFund | null> {
  const fund = await AjoFund.findById(fundId);

  if (!fund || fund.status !== "active") return fund;

  const goalReached = fund.amountRaised >= fund.targetAmount;
  const deadlinePassed = new Date() > fund.deadline;

  if (goalReached || deadlinePassed) {
    await settleFund(fund);
  }

  return fund;
}

/**
 * Sweeps all active funds whose deadline has passed and settles them.
 * Run this on a cron job (e.g. every 5-10 minutes).
 */
export async function sweepExpiredFunds(): Promise<number> {
  const expiredFunds = await AjoFund.find({
    status: "active",
    deadline: { $lt: new Date() },
  });

  for (const fund of expiredFunds) {
    await settleFund(fund);
  }

  return expiredFunds.length;
}