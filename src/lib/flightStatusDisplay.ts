// Label and colors for each flight status, shared by the results and flight status pages.

export type FlightStatusDisplay = { label: string; textClass: string; badgeClass: string };

const DISPLAY: Record<string, FlightStatusDisplay> = {
  SCHEDULED: { label: "On time", textClass: "text-green-700", badgeClass: "bg-green-700 text-white" },
  DELAYED: { label: "Delayed", textClass: "text-amber-600", badgeClass: "bg-amber-600 text-white" },
  BOARDING: { label: "Boarding", textClass: "text-azure-blue", badgeClass: "bg-azure-blue text-white" },
  DEPARTED: { label: "Departed", textClass: "text-gray-500", badgeClass: "bg-azure-navy text-white" },
  ARRIVED: { label: "Arrived", textClass: "text-gray-500", badgeClass: "bg-gray-500 text-white" },
  CANCELLED: { label: "Cancelled", textClass: "text-red-600", badgeClass: "bg-red-600 text-white" },
};

// unknown statuses fall back to their own name in gray
export function flightStatusDisplay(statusName: string): FlightStatusDisplay {
  return DISPLAY[statusName] ?? { label: statusName, textClass: "text-gray-500", badgeClass: "bg-gray-500 text-white" };
}
