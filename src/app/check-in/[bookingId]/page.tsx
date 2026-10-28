import { Suspense } from "react";
import Link from "next/link";

import { PageHeading } from "@/components/PageHeading";
import { SiteHeader } from "@/components/SiteHeader";
import { TripActionForm } from "@/components/trips/TripActionForm";
import { Card, cabinLabel, LegSummary, TripNotFound, travelerName } from "@/components/trips/TripParts";
import { checkInProblem, documentProblem } from "@/lib/bookingRules";
import { formatDate, formatTime } from "@/lib/format";
import { getTrip, legLabel, type TripLeg } from "@/lib/trips";
import type { TripTicketRow } from "@/lib/types";

import { checkIn } from "./actions";

// front cabins board first
const BOARDING_ZONES: Record<string, number> = { FIRST: 1, BUSINESS: 1, PREMIUM: 2, ECONOMY: 3 };

export default function CheckInBookingPage({ params }: PageProps<"/check-in/[bookingId]">) {
  return (
    <>
      <SiteHeader active="check-in" />

      <main className="flex-1 bg-azure-page">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
          <Suspense fallback={<p className="text-gray-500">Loading your booking...</p>}>
            <CheckInTrip params={params} />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function CheckInTrip({ params }: { params: Promise<{ bookingId: string }> }) {
  const bookingId = (await params).bookingId.toUpperCase();
  const trip = await getTrip(bookingId);
  if (!trip) return <TripNotFound bookingId={bookingId} backHref="/check-in" />;

  const { booking, legs } = trip;
  const confirmed = booking.booking_status_name === "CONFIRMED";

  return (
    <>
      <Link href={`/my-trips/${bookingId}`} className="text-sm font-semibold text-azure-blue hover:underline">
        View trip {bookingId}
      </Link>

      <PageHeading overline={`Check in · ${bookingId}`} title="Check in for your flight">
        Check-in opens 24 hours before departure and closes 45 minutes before. Every traveler needs a seat and a
        passport that is valid on the day of the flight.
      </PageHeading>

      {!confirmed ? (
        <Card>
          <p className="text-gray-600">
            This booking is {booking.booking_status_name.toLowerCase()}, so it can&apos;t be checked in.
          </p>
        </Card>
      ) : (
        legs.map((leg, i) => <LegCheckIn key={leg.flight.flight_id} bookingId={bookingId} leg={leg} label={legLabel(legs, i)} />)
      )}
    </>
  );
}

function LegCheckIn({ bookingId, leg, label }: { bookingId: string; leg: TripLeg; label: string }) {
  const closed = checkInProblem(leg.flight);
  const checkedIn = leg.tickets.filter((ticket) => ticket.checked_in === 1);
  const waiting = leg.tickets.filter((ticket) => ticket.checked_in !== 1);
  const ready = waiting.filter((ticket) => ticket.seat_number !== null && documentProblem(ticket) === null);

  return (
    <Card>
      <LegSummary label={label} flight={leg.flight} />

      {waiting.length > 0 && (
        <div className="mt-5 border-t border-gray-200 pt-4">
          {closed ? (
            <p className="text-sm text-gray-500">{closed}</p>
          ) : ready.length === 0 ? (
            // nobody here can check in online, so just show why
            <ul className="space-y-2">
              {waiting.map((ticket) => (
                <TravelerRow key={ticket.e_ticket_number} ticket={ticket} />
              ))}
            </ul>
          ) : (
            <TripActionForm
              action={checkIn}
              submitLabel={ready.length === 1 ? "Check in" : "Check in travelers"}
              pendingLabel="Checking in..."
            >
              <input type="hidden" name="booking_id" value={bookingId} />
              <input type="hidden" name="flight_id" value={leg.flight.flight_id} />
              <ul className="space-y-2">
                {waiting.map((ticket) => (
                  <TravelerRow key={ticket.e_ticket_number} ticket={ticket} />
                ))}
              </ul>
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input type="checkbox" required className="mt-1" />
                <span>I confirm no one here is carrying dangerous goods.</span>
              </label>
            </TripActionForm>
          )}
        </div>
      )}

      {checkedIn.length > 0 && (
        <div className="mt-5 space-y-4 border-t border-gray-200 pt-4">
          <h3 className="text-[11px] font-semibold tracking-widest text-gray-600 uppercase">Boarding passes</h3>
          {checkedIn.map((ticket) => (
            <BoardingPass key={ticket.e_ticket_number} ticket={ticket} />
          ))}
        </div>
      )}
    </Card>
  );
}

// a checkbox for travelers who can check in, otherwise the reason they can't
function TravelerRow({ ticket }: { ticket: TripTicketRow }) {
  const problem = ticket.seat_number === null ? "No seat assigned. Please see an agent at the airport." : documentProblem(ticket);

  return (
    <li className="flex items-start gap-3 rounded-control border border-gray-200 px-4 py-3">
      <input
        type="checkbox"
        name="e_ticket_number"
        value={ticket.e_ticket_number}
        defaultChecked={problem === null}
        disabled={problem !== null}
        aria-label={`Check in ${travelerName(ticket)}`}
        className="mt-1"
      />
      <div className="flex-1 text-sm">
        <p className="font-semibold text-gray-900">{travelerName(ticket)}</p>
        <p className="text-gray-600">
          Seat {ticket.seat_number ?? "none"} · {ticket.bag_count} checked {ticket.bag_count === 1 ? "bag" : "bags"}
          {ticket.passport_number && (
            <>
              {" "}
              · Passport ••••{ticket.passport_number.slice(-4)} ({ticket.nationality}), expires{" "}
              {formatDate(ticket.passport_expiry_date!)}
            </>
          )}
        </p>
        {problem && <p className="mt-1 text-red-600">{problem}</p>}
      </div>
    </li>
  );
}

function BoardingPass({ ticket }: { ticket: TripTicketRow }) {
  const zone = BOARDING_ZONES[ticket.cabin_class_name] ?? 3;

  return (
    <article className="overflow-hidden rounded-card border border-azure-navy/20">
      <div className="flex items-center justify-between bg-azure-navy px-5 py-2 text-white">
        <p className="text-sm font-semibold tracking-[0.18em]">AZURE AIR</p>
        <p className="text-xs tracking-widest uppercase">{ticket.boarded === 1 ? "Boarded" : "Boarding pass"}</p>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-6 bg-white p-5">
        <div className="space-y-4">
          <div>
            <PassLabel>Passenger</PassLabel>
            <p className="text-lg font-semibold text-azure-navy uppercase">{travelerName(ticket)}</p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-3xl font-semibold text-azure-navy">{ticket.origin}</p>
            <span className="text-gray-400">→</span>
            <p className="text-3xl font-semibold text-azure-navy">{ticket.destination}</p>
          </div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <PassField label="Flight" value={ticket.flight_number} />
            <PassField label="Date" value={formatDate(ticket.departure_time, ticket.origin_timezone)} />
            <PassField label="Boards" value={formatTime(ticket.boarding_time, ticket.origin_timezone)} />
            <PassField label="Departs" value={formatTime(ticket.departure_time, ticket.origin_timezone)} />
          </div>
        </div>
        <div className="grid grid-cols-2 content-start gap-4 border-l border-dashed border-gray-300 pl-6 text-sm">
          <PassField label="Seat" value={ticket.seat_number ?? "—"} large />
          <PassField label="Zone" value={String(zone)} large />
          <PassField label="Gate" value={ticket.departure_gate?.split(" · ")[1] ?? "TBA"} large />
          <PassField label="Cabin" value={cabinLabel(ticket.cabin_class_name)} />
          <div className="col-span-2">
            <PassLabel>E-ticket</PassLabel>
            <p className="font-mono text-gray-900">{ticket.e_ticket_number}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function PassLabel({ children }: { children: string }) {
  return <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase">{children}</p>;
}

function PassField({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return (
    <div>
      <PassLabel>{label}</PassLabel>
      <p className={large ? "text-2xl font-semibold text-azure-navy" : "font-semibold text-gray-900"}>{value}</p>
    </div>
  );
}
