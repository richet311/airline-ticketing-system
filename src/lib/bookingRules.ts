import { CHECKED_BAG_FEES } from "@/lib/baggageFees";

// Rules for the Bookings tile used by the tile to grey out choices and preview the cost

// A ticket's fare class and seat can only change before takeoff
export const CHANGEABLE_FLIGHT_STATUSES = ["SCHEDULED", "DELAYED"];

// Bags can be added for longer: right up until the plane leaves
export const BAG_FLIGHT_STATUSES = ["SCHEDULED", "DELAYED", "BOARDING"];

export function statusChangeProblem(from: string, to: string): string | null {
  if (from === to) return null;
  if (from === "CANCELLED") return "A cancelled booking can't be reopened.";
  if (from === "CONFIRMED" && to === "PENDING") return "A confirmed booking can't go back to pending.";
  return null;
}

export function bagFeeAt(index: number): number {
  return CHECKED_BAG_FEES[Math.min(index, CHECKED_BAG_FEES.length - 1)];
}

export function bagWeightProblem(weight: number): string | null {
  return Number.isFinite(weight) && weight > 0 && weight <= 100 ? null : "Bag weight must be above 0 and at most 100 lb.";
}

//pricing logic for changing cabin classes
export function cabinChangeCost(oldPrice: number, newPrice: number, oldChangeFee: number): number {
  return roundCents(newPrice - oldPrice + oldChangeFee);
}

// Cancelling refunds everything that was paid
export function cancellationRefund(paid: number): number {
  return Math.max(0, roundCents(paid));
}

export function roundCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}
