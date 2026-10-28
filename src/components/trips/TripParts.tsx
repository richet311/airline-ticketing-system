import type { ReactNode } from "react";
import Link from "next/link";

import { flightStatusDisplay } from "@/lib/flightStatusDisplay";
import { formatDate, formatDuration, formatTime } from "@/lib/format";
import type { TripTicketRow } from "@/lib/types";

// Pieces shared by the My Trips and Check In pages

export function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-card border border-gray-200 bg-white p-6 shadow-card">{children}</section>;
}

const BOOKING_STATUS_CLASSES: Record<string, string> = {
  CONFIRMED: "bg-green-50 text-green-700 ring-green-600/20",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  CANCELLED: "bg-red-50 text-red-700 ring-red-600/20",
};

export function BookingStatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-control px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
        BOOKING_STATUS_CLASSES[status] ?? "bg-gray-50 text-gray-700 ring-gray-500/20"
      }`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function FlightStatusBadge({ status }: { status: string }) {
  const display = flightStatusDisplay(status);
  return (
    <span className={`inline-block rounded-control px-2 py-0.5 text-xs font-semibold ${display.badgeClass}`}>
      {display.label}
    </span>
  );
}

// One flight: when it leaves and lands (local times at each airport), its number, cabin and gate
export function LegSummary({ label, flight }: { label: string; flight: TripTicketRow }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold tracking-widest text-gray-600 uppercase">
          {label} · {formatDate(flight.departure_time, flight.origin_timezone)}
        </p>
        <div className="mt-1 flex items-center gap-6">
          <Endpoint code={flight.origin} city={flight.origin_city} time={formatTime(flight.departure_time, flight.origin_timezone)} />
          <div className="text-center text-xs text-gray-500">
            <p>{formatDuration(flight.duration_min)}</p>
            <div className="my-1 h-px w-16 bg-gray-300" />
            <p>Nonstop</p>
          </div>
          <Endpoint
            code={flight.destination}
            city={flight.destination_city}
            time={formatTime(flight.arrival_time, flight.destination_timezone)}
          />
        </div>
      </div>
      <div className="space-y-1 text-right text-sm text-gray-600">
        <FlightStatusBadge status={flight.flight_status_name} />
        <p>
          {flight.flight_number} · {cabinLabel(flight.cabin_class_name)}
        </p>
        {flight.departure_gate && <p>Gate {flight.departure_gate}</p>}
      </div>
    </div>
  );
}

function Endpoint({ code, city, time }: { code: string; city: string; time: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold text-azure-navy">{time}</p>
      <p className="text-sm text-gray-600">
        <span className="font-semibold text-gray-900">{code}</span> {city}
      </p>
    </div>
  );
}

export function TripNotFound({ bookingId, backHref }: { bookingId: string; backHref: string }) {
  return (
    <Card>
      <p className="text-gray-600">
        We couldn&apos;t find a booking with confirmation code {bookingId}.{" "}
        <Link href={backHref} className="font-semibold text-azure-blue hover:underline">
          Try looking it up again
        </Link>
      </p>
    </Card>
  );
}

// "ECONOMY" -> "Economy"
export function cabinLabel(cabin: string): string {
  return cabin.charAt(0) + cabin.slice(1).toLowerCase();
}

// "Ana", "Diaz" -> "Ana Diaz"
export function travelerName(ticket: { first_name: string | null; last_name: string | null }): string {
  return `${ticket.first_name ?? ""} ${ticket.last_name ?? ""}`.trim() || "Traveler";
}
