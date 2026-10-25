// Azure Rewards numbers, shared by the server and the checkout form

export const POINTS_PER_DOLLAR = 5;
export const POINTS_PER_DOLLAR_OFF = 100;
export const MIN_POINTS_TO_REDEEM = 1000;

// pointsEarned(248, 40) = 248 x 5 x 1.4 = 1736
export function pointsEarned(amount: number, bonusPercent: number): number {
  return Math.floor(amount * POINTS_PER_DOLLAR * (1 + bonusPercent / 100));
}
