// fee per checked bag, per traveler, per flight ([0] = 1st bag, [1] = 2nd)
export const CHECKED_BAG_FEES = [0, 35];

// bagFee(2) = 0 + 35 = 35
export function bagFee(bags: number): number {
  return CHECKED_BAG_FEES.slice(0, bags).reduce((sum, fee) => sum + fee, 0);
}
