//validation to ensure gates are required when needed
const NEEDS_DEPARTURE_GATE = ["BOARDING", "DEPARTED", "ARRIVED"];
const NEEDS_ARRIVAL_GATE = ["ARRIVED"];

// Only AVAILABLE gates are allowed for flights.
// OCCUPIED = another aircraft is taking longer to depart/arrive there; MAINTENANCE = out of use.
// Neither is safe, so a flight at one has to be moved.
export const ASSIGNABLE_GATE_STATUS = "AVAILABLE";

// gate agent: once a flight has left, its gates' statuses can't be changed from it
export const DEPARTED_FLIGHT_STATUSES = ["DEPARTED", "ARRIVED"];

// gate agent: passengers can be checked in and boarded until the plane leaves
export const BOARDING_FLIGHT_STATUSES = ["SCHEDULED", "DELAYED", "BOARDING"];

export function gateRequired(which: "departure" | "arrival", status: string): boolean {
  return (which === "departure" ? NEEDS_DEPARTURE_GATE : NEEDS_ARRIVAL_GATE).includes(status);
}

//explains for users reasoning
export function missingGateMessage(status: string, hasDepartureGate: boolean, hasArrivalGate: boolean): string | null {
  if (gateRequired("departure", status) && !hasDepartureGate) return `${status} flight needs a departure gate first.`;
  if (gateRequired("arrival", status) && !hasArrivalGate) return `${status} flight needs an arrival gate first.`;
  return null;
}
