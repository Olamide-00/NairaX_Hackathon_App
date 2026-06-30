import { User } from "../../models/user.model";
import {
  calculateSpendPoints,
  calculateReceivePoints,
  getTierForPoints,
} from "../../utils/xpoints.utils";

type PointEventType = "spend" | "receive";

/**
 * Awards X Points to a user based on a transaction amount, then
 * recalculates and updates their tier. Safe to call after any
 * successful spend (transfer/contribution) or receive (webhook credit).
 */
export async function awardXPoints(
  userId: string,
  amount: number,
  type: PointEventType
): Promise<void> {
  const pointsEarned =
    type === "spend"
      ? calculateSpendPoints(amount)
      : calculateReceivePoints(amount);

  if (pointsEarned <= 0) return; // nothing to award, skip the write

  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { xPoints: pointsEarned } },
    { new: true }
  );

  if (!user) return;

  const newTier = getTierForPoints(user.xPoints);

  if (newTier !== user.tier) {
    await User.findByIdAndUpdate(userId, { tier: newTier });
  }
}