//validation to ensure gates are required when needed
const NEEDS_DEPARTURE_GATE = ["BOARDING", "DEPARTED", "ARRIVED"];
const NEEDS_ARRIVAL_GATE = ["ARRIVED"];

//Only AVAILABLE gates should be flown to. OCCUPIED means another aircraft is taking longer to depart/arrive there, and
//MAINTENANCE is strictly out of service
export const ASSIGNABLE_GATE_STATUS = "AVAILABLE";

export const DEPARTED_FLIGHT_STATUSES = ["DEPARTED", "ARRIVED"];

export const BOARDING_FLIGHT_STATUSES = ["SCHEDULED", "DELAYED", "BOARDING"];

export function gateRequired(which: "departure" | "arrival", status: string): boolean {
  return (which === "departure" ? NEEDS_DEPARTURE_GATE : NEEDS_ARRIVAL_GATE).includes(status);
}

export function missingGateMessage(status: string, hasDepartureGate: boolean, hasArrivalGate: boolean): string | null {
  if (gateRequired("departure", status) && !hasDepartureGate) return `${status} flight needs a departure gate first.`;
  if (gateRequired("arrival", status) && !hasArrivalGate) return `${status} flight needs an arrival gate first.`;
  return null;
}
