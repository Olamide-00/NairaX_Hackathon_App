import { User } from "../../models/user.model";
import {
  calculateSpendPoints,
  calculateReceivePoints,
  getTierForPoints,
} from "../../utils/xpoints.utils";

type PointEventType = "spend" | "receive";


export async function awardXPoints(
  userId: string,
  amount: number,
  type: PointEventType
): Promise<void> {
  const pointsEarned =
    type === "spend"
      ? calculateSpendPoints(amount)
      : calculateReceivePoints(amount);

  if (pointsEarned <= 0) return; 

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