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

// Rules for what customers can do themselves in My Trips and Check In

// Customers can cancel or change a flight online until an hour before it leaves
export const CUSTOMER_CUTOFF_MINUTES = 60;

// Online check-in opens 24 hours before departure and closes 45 minutes before
export const CHECK_IN_OPENS_MINUTES = 24 * 60;
export const CHECK_IN_CLOSES_MINUTES = 45;

// Boarding starts this long before departure (printed on the boarding pass)
export const BOARDING_STARTS_MINUTES = 40;

// Check-in stays open through boarding, as long as the window above hasn't closed
export const CHECK_IN_FLIGHT_STATUSES = ["SCHEDULED", "DELAYED", "BOARDING"];

type LegForRules = {
  flight_number: string;
  flight_status_name: string;
  minutes_to_departure: number;
  checked_in: 0 | 1 | null;
};

// Why the travelers on this flight (one row per ticket) can't change or cancel it, or null if they can.
// A flight we cancelled can always be changed or cancelled.
export function legChangeProblem(leg: LegForRules[], verb: "changed" | "cancelled" = "changed"): string | null {
  const flight = leg[0];
  if (flight.flight_status_name === "CANCELLED") return null;
  if (!CHANGEABLE_FLIGHT_STATUSES.includes(flight.flight_status_name)) {
    const already = flight.flight_status_name === "BOARDING" ? "is boarding" : "has already left";
    return `Your ${flight.flight_number} flight ${already}, so this can't be ${verb} online.`;
  }
  if (flight.minutes_to_departure <= CUSTOMER_CUTOFF_MINUTES) {
    return `Trips can't be ${verb} online within 1 hour of departure. Please see an agent at the airport.`;
  }
  if (leg.some((ticket) => ticket.checked_in === 1)) {
    return `A traveler has already checked in, so this can't be ${verb} online. Please contact customer service.`;
  }
  return null;
}

// Why the whole booking can't be cancelled online, or null if it can
export function cancelProblem(bookingStatus: string, legs: LegForRules[][]): string | null {
  if (bookingStatus === "CANCELLED") return "This trip is already cancelled.";
  if (bookingStatus !== "CONFIRMED") return "Only confirmed trips can be cancelled online.";
  for (const leg of legs) {
    const problem = legChangeProblem(leg, "cancelled");
    if (problem) return problem;
  }
  return null;
}

// Why online check-in isn't open for this flight, or null when it is
export function checkInProblem(flight: Omit<LegForRules, "checked_in">): string | null {
  if (flight.flight_status_name === "CANCELLED") return "This flight is cancelled.";
  if (!CHECK_IN_FLIGHT_STATUSES.includes(flight.flight_status_name)) return "This flight has already left.";
  if (flight.minutes_to_departure > CHECK_IN_OPENS_MINUTES) return "Check-in opens 24 hours before departure.";
  if (flight.minutes_to_departure <= CHECK_IN_CLOSES_MINUTES) {
    return "Online check-in closed 45 minutes before departure. Please see an agent at the airport.";
  }
  return null;
}

// A traveler needs a passport on file that is still valid on the day of the flight
export function documentProblem(ticket: {
  passport_number: string | null;
  passport_expiry_date: string | null;
  departure_time: string;
}): string | null {
  if (!ticket.passport_number || !ticket.passport_expiry_date) return "No passport on file.";
  // YYYY-MM-DD strings sort in date order
  if (ticket.passport_expiry_date <= ticket.departure_time.slice(0, 10)) return "Passport expires before this flight.";
  return null;
}
