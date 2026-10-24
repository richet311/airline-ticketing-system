import { CHECKED_BAG_FEES } from "@/lib/baggageFees";

// Rules for the Bookings tile. Used by the tile (to grey out choices and preview the money) and
// by its Confirm action (to refuse changes and work out the money), so the two always agree.

// A ticket's fare class and seat can only change before boarding starts.
export const CHANGEABLE_FLIGHT_STATUSES = ["SCHEDULED", "DELAYED"];

// Bags can be added for longer: right up until the plane leaves (checked at the gate while boarding).
export const BAG_FLIGHT_STATUSES = ["SCHEDULED", "DELAYED", "BOARDING"];

// Why a booking can't go from one status to another, or null if it can.
// - CANCELLED is final: the booking's seats were given up.
// - CONFIRMED can't go back to PENDING.
// - PENDING can be confirmed; anything can be cancelled.
export function statusChangeProblem(from: string, to: string): string | null {
  if (from === to) return null;
  if (from === "CANCELLED") return "A cancelled booking can't be reopened.";
  if (from === "CONFIRMED" && to === "PENDING") return "A confirmed booking can't go back to pending.";
  return null;
}

// The fee for a ticket's bag number `index` (0 = its first bag). Same fees as checkout
// (src/lib/baggageFees.ts); there's no limit here, and every bag after those costs the last fee.
export function bagFeeAt(index: number): number {
  return CHECKED_BAG_FEES[Math.min(index, CHECKED_BAG_FEES.length - 1)];
}

// A bag's weight in pounds: above 0, at most 100 (check_baggage_weightage in schema.sql).
export function bagWeightProblem(weight: number): string | null {
  return Number.isFinite(weight) && weight > 0 && weight <= 100 ? null : "Bag weight must be above 0 and at most 100 lb.";
}

// Moving a ticket to a different cabin costs the change fee of the cabin it's leaving
// (fare_class.change_fee: Economy 50, Premium 100, Business 150, First 300), on top of the price
// difference. A new seat in the same cabin is free.
export function cabinChangeCost(oldPrice: number, newPrice: number, oldChangeFee: number): number {
  return roundCents(newPrice - oldPrice + oldChangeFee);
}

// Cancelling refunds everything that was paid.
export function cancellationRefund(paid: number): number {
  return Math.max(0, roundCents(paid));
}

export function roundCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}
