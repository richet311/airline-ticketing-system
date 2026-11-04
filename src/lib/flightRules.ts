export const MAX_FLIGHT_HOURS = 36;

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
