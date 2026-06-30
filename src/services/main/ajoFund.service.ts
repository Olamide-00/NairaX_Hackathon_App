import { AjoFund, IAjoFund } from "../../models/ajoFund.model";
import { Wallet } from "../../models/wallet.model";
import { Transaction } from "../../models/transaction.model";
import { randomUUID } from "crypto";


export async function settleFund(fund: IAjoFund): Promise<void> {
  if (fund.status !== "active") return; 

  const creatorWallet = await Wallet.findOne({ userId: fund.creatorId });

  if (!creatorWallet) {
    console.error(`Settlement failed — wallet not found for creator ${fund.creatorId}`);
    return;
  }

  const payoutAmount = fund.amountRaised;
  const isGoalReached = fund.amountRaised >= fund.targetAmount;

  if (payoutAmount > 0) {
    // Credit creator wallet
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