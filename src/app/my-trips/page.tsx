import { Suspense } from "react";
import Link from "next/link";

import { PageHeading } from "@/components/PageHeading";
import { SiteHeader } from "@/components/SiteHeader";
import { TripLookupForm } from "@/components/TripLookupForm";
import { BookingStatusPill } from "@/components/trips/TripParts";
import { checkInProblem } from "@/lib/bookingRules";
import { db } from "@/lib/db";
import { formatMonthDay } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import type { MyTripRow } from "@/lib/types";

// one booking on the list, built from its ticket rows
type TripCardData = {
  bookingId: string;
  status: string;
  flights: MyTripRow[]; // one row per flight, in departure order
  travelers: number;
  upcoming: boolean;
};

export default function MyTripsPage() {
  return (
    <>
      <SiteHeader active="my-trips" />

      <main className="flex-1 bg-azure-page">
        <Suspense fallback={null}>
          <SignedInTrips />
        </Suspense>

        <section className="border-b border-gray-200 bg-white py-12">
          <div className="mx-auto max-w-6xl space-y-8 px-4">
            <PageHeading overline="My trips" title="Find your trip">
              No account needed. Enter your confirmation code and the last name on the booking.
            </PageHeading>
            <TripLookupForm goTo="my-trips" submitLabel="Find trip" />
          </div>
        </section>
      </main>
    </>
  );
}

// Upcoming, past and cancelled trips for a signed-in customer: ones they booked or are flying on
async function SignedInTrips() {
  const user = await getCurrentUser();
  if (!user || user.passenger_id === null) return null;

  const [rows] = await db.query<MyTripRow[]>(
    `SELECT t.booking_id, bs.booking_status_name, t.passenger_id,
            f.flight_id, f.flight_number, f.departure_time, f.arrival_time,
            TIMESTAMPDIFF(MINUTE, NOW(), f.departure_time) AS minutes_to_departure,
            o.airport_code AS origin, o.city AS origin_city, o.timezone AS origin_timezone,
            d.airport_code AS destination, d.city AS destination_city,
            fs.flight_status_name
       FROM ticket t
       JOIN booking b        ON b.booking_id = t.booking_id
       JOIN booking_status bs ON bs.booking_status_id = b.booking_status_id
       JOIN flight f         ON f.flight_id = t.flight_id
       JOIN flight_status fs ON fs.flight_status_id = f.flight_status_id
       JOIN airport o        ON o.airport_id = f.origin_airport_id
       JOIN airport d        ON d.airport_id = f.destination_airport_id
      WHERE b.passenger_id = ?
         OR t.booking_id IN (SELECT booking_id FROM ticket WHERE passenger_id = ?)
      ORDER BY f.departure_time, t.e_ticket_number`,
    [user.passenger_id, user.passenger_id],
  );

  const trips = new Map<string, TripCardData & { passengers: Set<number> }>();
  for (const row of rows) {
    let trip = trips.get(row.booking_id);
    if (!trip) {
      trip = { bookingId: row.booking_id, status: row.booking_status_name, flights: [], travelers: 0, upcoming: false, passengers: new Set() };
      trips.set(row.booking_id, trip);
    }
    trip.passengers.add(row.passenger_id);
    trip.travelers = trip.passengers.size;
    if (!trip.flights.some((flight) => flight.flight_id === row.flight_id)) trip.flights.push(row);
    // still to fly until the last flight has left
    if (row.minutes_to_departure > 0 && row.flight_status_name !== "CANCELLED") trip.upcoming = true;
  }

  const all = [...trips.values()];
  const upcoming = all.filter((trip) => trip.status !== "CANCELLED" && trip.upcoming);
  // most recent first
  const past = all.filter((trip) => trip.status !== "CANCELLED" && !trip.upcoming).reverse();
  const cancelled = all.filter((trip) => trip.status === "CANCELLED").reverse();

  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl space-y-10 px-4">
        <PageHeading overline="My trips" title={`Welcome back${user.first_name ? `, ${user.first_name}` : ""}`} />
        <TripGroup title="Upcoming" trips={upcoming} empty="No upcoming trips. Where to next?" emptyLink />
        {past.length > 0 && <TripGroup title="Past" trips={past} />}
        {cancelled.length > 0 && <TripGroup title="Cancelled" trips={cancelled} />}
      </div>
    </section>
  );
}

function TripGroup({
  title,
  trips,
  empty,
  emptyLink = false,
}: {
  title: string;
  trips: TripCardData[];
  empty?: string;
  emptyLink?: boolean;
}) {
  return (
    <div>
      <h2 className="mb-3 text-[13px] font-semibold tracking-widest text-gray-600 uppercase">
        {title} {trips.length > 0 && `(${trips.length})`}
      </h2>
      {trips.length === 0 ? (
        <p className="rounded-card border border-gray-200 bg-white p-6 text-gray-600 shadow-card">
          {empty}{" "}
          {emptyLink && (
            <Link href="/" className="font-semibold text-azure-blue hover:underline">
              Book a flight
            </Link>
          )}
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {trips.map((trip) => (
            <TripCard key={trip.bookingId} trip={trip} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TripCard({ trip }: { trip: TripCardData }) {
  const first = trip.flights[0];
  const last = trip.flights[trip.flights.length - 1];
  const roundTrip = trip.flights.length === 2 && last.destination === first.origin;
  const canCheckIn = trip.status === "CONFIRMED" && trip.flights.some((flight) => checkInProblem(flight) === null);
  const hasCancelledFlight = trip.status !== "CANCELLED" && trip.flights.some((f) => f.flight_status_name === "CANCELLED");

  return (
    <li className="flex flex-col rounded-card border border-gray-200 bg-white p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-gray-600 uppercase">
            {roundTrip ? "Round trip" : trip.flights.length === 1 ? "One way" : `${trip.flights.length} flights`} ·{" "}
            {formatMonthDay(first.departure_time, first.origin_timezone)}
            {trip.flights.length > 1 && ` – ${formatMonthDay(last.departure_time, last.origin_timezone)}`}
          </p>
          <h3 className="mt-1 text-xl font-semibold text-azure-navy">
            {first.origin_city} {roundTrip ? "⇄" : "→"} {first.destination_city}
          </h3>
          <p className="text-sm text-gray-600">
            {trip.flights.map((flight) => `${flight.origin}–${flight.destination}`).join(", ")} · {trip.travelers}{" "}
            {trip.travelers === 1 ? "traveler" : "travelers"}
          </p>
        </div>
        <BookingStatusPill status={trip.status} />
      </div>

      {hasCancelledFlight && (
        <p className="mt-3 text-sm font-semibold text-red-600">A flight on this trip was cancelled. Change or cancel it for free.</p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <p className="font-mono text-sm tracking-[0.2em] text-gray-500">{trip.bookingId}</p>
        <div className="flex gap-2">
          {canCheckIn && (
            <Link
              href={`/check-in/${trip.bookingId}`}
              className="rounded-control bg-azure-blue px-4 py-2 text-sm font-semibold text-white hover:bg-azure-blue-dark"
            >
              Check in
            </Link>
          )}
          <Link
            href={`/my-trips/${trip.bookingId}`}
            className="rounded-control border border-azure-blue px-4 py-2 text-sm font-semibold text-azure-blue hover:bg-azure-blue hover:text-white"
          >
            View trip
          </Link>
        </div>
      </div>
    </li>
  );
}
