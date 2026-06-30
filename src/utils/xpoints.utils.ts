import { UserTier } from "../models/user.model";

const SPEND_RATE = 100;   // ₦50 spent = 1 X Point
const RECEIVE_RATE = 200; // ₦200 received = 1 X Point

export const TIER_THRESHOLDS: { tier: UserTier; minPoints: number }[] = [
  { tier: "Odogwu", minPoints: 1_000_000 },
  { tier: "Legend", minPoints: 600_000 },
  { tier: "Don", minPoints: 350_000 },
  { tier: "Big Boss", minPoints: 150_000 },
  { tier: "Big Player", minPoints: 50_000 },
  { tier: "Grinder", minPoints: 20_000 },
  { tier: "Hustler", minPoints: 5_000 },
  { tier: "Starter", minPoints: 0 },
];

export function calculateSpendPoints(amount: number): number {
  return Math.floor(amount / SPEND_RATE);
}

export function calculateReceivePoints(amount: number): number {
  return Math.floor(amount / RECEIVE_RATE);
}

export function getTierForPoints(points: number): UserTier {
  const match = TIER_THRESHOLDS.find((t) => points >= t.minPoints);
  return match ? match.tier : "Starter";
}

export function getNextTierInfo(points: number): {
  nextTier: UserTier | null;
  pointsToNextTier: number;
} {
  const ascending = [...TIER_THRESHOLDS].reverse();
  const next = ascending.find((t) => t.minPoints > points);

  if (!next) {
    return { nextTier: null, pointsToNextTier: 0 };
  }

  return {
    nextTier: next.tier,
    pointsToNextTier: next.minPoints - points,
  };
}