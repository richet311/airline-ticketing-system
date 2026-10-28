import { Suspense } from "react";
import Link from "next/link";

import { PageHeading } from "@/components/PageHeading";
import { SiteHeader } from "@/components/SiteHeader";
import { TripActionForm } from "@/components/trips/TripActionForm";
import { Card, FlightStatusBadge, LegSummary, TripNotFound } from "@/components/trips/TripParts";
import { legChangeProblem } from "@/lib/bookingRules";
import { formatDate, formatDuration, formatMoney, formatTime } from "@/lib/format";
import { findReplacementFlights, getTrip, legLabel, type Trip, type TripLeg } from "@/lib/trips";

import { changeFlight } from "./actions";

export default function ChangeFlightPage({ params }: PageProps<"/my-trips/[bookingId]/change">) {
  return (
    <>
      <SiteHeader active="my-trips" />

      <main className="flex-1 bg-azure-page">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
          <Suspense fallback={<p className="text-gray-500">Loading your trip...</p>}>
            <ChangeFlight params={params} />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function ChangeFlight({ params }: { params: Promise<{ bookingId: string }> }) {
  const bookingId = (await params).bookingId.toUpperCase();
  const trip = await getTrip(bookingId);
  if (!trip) return <TripNotFound bookingId={bookingId} backHref="/my-trips" />;

  const confirmed = trip.booking.booking_status_name === "CONFIRMED";

  return (
    <>
      <Link href={`/my-trips/${bookingId}`} className="text-sm font-semibold text-azure-blue hover:underline">
        ← Back to trip {bookingId}
      </Link>

      <PageHeading overline="Change flight" title="Choose a new flight">
        Move everyone on a flight to another one on the same route, in the same cabin. You pay the fare difference
        plus the change fee for the cabin you&apos;re in, or we refund you if the new fare is lower.
      </PageHeading>

      {!confirmed ? (
        <Card>
          <p className="text-gray-600">Only confirmed trips can be changed online.</p>
        </Card>
      ) : (
        trip.legs.map((leg, i) => <LegOptions key={leg.flight.flight_id} trip={trip} leg={leg} label={legLabel(trip.legs, i)} />)
      )}
    </>
  );
}

async function LegOptions({ trip, leg, label }: { trip: Trip; leg: TripLeg; label: string }) {
  const problem = legChangeProblem(leg.tickets);
  const options = problem ? [] : await findReplacementFlights(trip, leg);
  const { flight } = leg;
  const travelers = leg.tickets.length;

  return (
    <Card>
      <LegSummary label={label} flight={flight} />

      <div className="mt-5 border-t border-gray-200 pt-4">
        {problem ? (
          <p className="text-sm text-gray-500">{problem}</p>
        ) : options.length === 0 ? (
          <p className="text-sm text-gray-500">
            There are no other {flight.origin} to {flight.destination} flights with room for {travelers}{" "}
            {travelers === 1 ? "traveler" : "travelers"} that fit your trip.
          </p>
        ) : (
          <>
            {flight.flight_status_name === "CANCELLED" && (
              <p className="mb-3 text-sm font-semibold text-green-700">
                We cancelled this flight, so there&apos;s no change fee.
              </p>
            )}
            <ul className="divide-y divide-gray-100">
              {options.map((option) => (
                <li key={option.flight.flight_id} className="flex flex-wrap items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-widest text-gray-600 uppercase">
                      {formatDate(option.flight.departure_time, flight.origin_timezone)} · {option.flight.flight_number}
                    </p>
                    <p className="text-lg font-semibold text-azure-navy">
                      {formatTime(option.flight.departure_time, flight.origin_timezone)} →{" "}
                      {formatTime(option.flight.arrival_time, flight.destination_timezone)}{" "}
                      <span className="text-sm font-normal text-gray-500">{formatDuration(option.flight.duration_min)}</span>
                    </p>
                    <FlightStatusBadge status={option.flight.flight_status_name} />
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${option.cost < 0 ? "text-green-700" : "text-gray-900"}`}>
                        {option.cost > 0
                          ? `+${formatMoney(option.cost)}`
                          : option.cost < 0
                            ? `${formatMoney(-option.cost)} back`
                            : "No charge"}
                      </p>
                      <p className="text-xs text-gray-500">
                        for {travelers} {travelers === 1 ? "traveler" : "travelers"}
                      </p>
                    </div>
                    <TripActionForm action={changeFlight} submitLabel="Switch" pendingLabel="Switching...">
                      <input type="hidden" name="booking_id" value={trip.booking.booking_id} />
                      <input type="hidden" name="flight_id" value={flight.flight_id} />
                      <input type="hidden" name="new_flight_id" value={option.flight.flight_id} />
                    </TripActionForm>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-gray-500">
              Times are local to each airport. New seats are picked for you, next to each other where possible. Checked
              bags move with you.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
