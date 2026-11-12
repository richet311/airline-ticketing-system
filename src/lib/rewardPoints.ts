// Azure Rewards numbers, shared by the server and the checkout form

export const POINTS_PER_DOLLAR = 5;
export const POINTS_PER_DOLLAR_OFF = 100;
export const MIN_POINTS_TO_REDEEM = 1000;

// what an upgrade costs in points: upgradePoints(15) = 1500
export function upgradePoints(price: number): number {
  return Math.round(price * POINTS_PER_DOLLAR_OFF);
}

// a booked upgrade's price line: only card-paid upgrades count toward the money total
// { Wi-Fi, $20, POINTS } -> { label: "In-flight Wi-Fi (2,000 points)", amount: 0 }
export function upgradeLine(upgrade: { upgrade_name: string; upgrade_price: number; paid_with?: string }) {
  if (upgrade.paid_with === "POINTS") {
    return { label: `${upgrade.upgrade_name} (${upgradePoints(upgrade.upgrade_price).toLocaleString("en-US")} points)`, amount: 0 };
  }
  if (upgrade.paid_with === "TIER") return { label: `${upgrade.upgrade_name} (rewards perk)`, amount: 0 };
  return { label: upgrade.upgrade_name, amount: Number(upgrade.upgrade_price) };
}

// pointsEarned(248, 40) = 248 x 5 x 1.4 = 1736
export function pointsEarned(amount: number, bonusPercent: number): number {
  return Math.floor(amount * POINTS_PER_DOLLAR * (1 + bonusPercent / 100));
}
