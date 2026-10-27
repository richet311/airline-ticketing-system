import { BOOKING_STATUS, FLIGHT_STATUS } from "@/lib/statuses";

// opens 24h before, closes 45 min before
export const CHECK_IN_OPENS_MINUTES = 24 * 60;
export const CHECK_IN_CLOSES_MINUTES = 45;
export const BOARDING_STARTS_MINUTES = 40;

export type CheckInState =
  | "unpaid"
  | "booking-cancelled"
  | "flight-cancelled"
  | "done"
  | "delayed"
  | "closed"
  | "not-open"
  | "open";

// page and checkIn() both use this so they match
export function checkInState(input: {
  bookingStatusId: number;
  flightStatusId: number;
  minutesToDeparture: number;
  allCheckedIn: boolean;
}): CheckInState {
  if (input.bookingStatusId === BOOKING_STATUS.PENDING) return "unpaid";
  if (input.bookingStatusId !== BOOKING_STATUS.CONFIRMED) return "booking-cancelled";
  if (input.flightStatusId === FLIGHT_STATUS.CANCELLED) return "flight-cancelled";
  if (input.allCheckedIn) return "done";
  if (input.flightStatusId === FLIGHT_STATUS.DELAYED) return "delayed";
  if (input.flightStatusId !== FLIGHT_STATUS.SCHEDULED) return "closed";
  if (input.minutesToDeparture < CHECK_IN_CLOSES_MINUTES) return "closed";
  if (input.minutesToDeparture > CHECK_IN_OPENS_MINUTES) return "not-open";
  return "open";
}

// null = good to go
export function travelerProblem(input: {
  seatNumber: string | null;
  international: boolean;
  passportNumber: string | null;
  passportExpiry: string | null;
  departureTime: string;
}): string | null {
  if (input.seatNumber === null) return "No seat on this ticket. Please see an agent at the airport.";
  if (input.international) {
    if (!input.passportNumber || !input.passportExpiry) return "Passport needed for this international flight.";
    if (input.passportExpiry <= input.departureTime.slice(0, 10)) return "Passport expires before this flight.";
  }
  return null;
}

// no boarding_group column so we go by cabin
export function boardingGroup(cabinClassName: string): number {
  if (cabinClassName === "FIRST" || cabinClassName === "BUSINESS") return 1;
  if (cabinClassName === "PREMIUM") return 2;
  return 3;
}

export function boardingTime(departureTime: string): string {
  return minutesBefore(departureTime, BOARDING_STARTS_MINUTES);
}

export function checkInOpensAt(departureTime: string): string {
  return minutesBefore(departureTime, CHECK_IN_OPENS_MINUTES);
}

// "2026-11-14 06:05:00" minus 40 -> "2026-11-14 05:25:00" (still UTC)
function minutesBefore(time: string, minutes: number): string {
  const date = new Date(`${time.replace(" ", "T")}Z`);
  return new Date(date.getTime() - minutes * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
}
