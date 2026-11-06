export const MAX_FLIGHT_HOURS = 36;

// Statuses only move forward: a departed flight can only land, and arrived or cancelled flights are final.
// The check_flight_status_order trigger enforces the same rule in the database.
export function flightStatusChangeProblem(from: string, to: string): string | null {
  if (from === to) return null;
  if (from === "ARRIVED") return "This flight has arrived, so its status can't change.";
  if (from === "CANCELLED") return "A cancelled flight can't be reopened. Schedule a new flight instead.";
  if (from === "DEPARTED" && to !== "ARRIVED") return "A departed flight can only move to Arrived.";
  return null;
}

export function attentionReason(flight: {
  status: string;
  hasDepartureGate: boolean;
  hasArrivalGate: boolean;
  pastDeparture: boolean;
  pastArrival: boolean;
}): string | null {
  if (!flight.pastDeparture || flight.status === "ARRIVED" || flight.status === "CANCELLED") return null;
  if (flight.status === "DELAYED") return "Delayed past its departure time. Set a new status.";
  if (flight.status !== "DEPARTED" && !flight.hasDepartureGate) return "Past departure. Needs a departure gate.";
  if (flight.pastArrival && !flight.hasArrivalGate) return "Past arrival. Needs an arrival gate.";
  return null;
}
