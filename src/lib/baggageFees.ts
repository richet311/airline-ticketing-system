// fee per checked bag, per traveler, per flight ([0] = 1st bag, [1] = 2nd)
export const CHECKED_BAG_FEES = [0, 35];

// bagFee(2) = 0 + 35 = 35
// tierFreeBags is the rewards perk: that many more bags are free (same rule as the apply_free_bag_perk trigger)
// bagFee(2, 1) = 0 + 0 = 0
export function bagFee(bags: number, tierFreeBags = 0): number {
  return CHECKED_BAG_FEES.slice(0, bags).reduce((sum, fee, i) => sum + (i < 1 + tierFreeBags ? 0 : fee), 0);
}
