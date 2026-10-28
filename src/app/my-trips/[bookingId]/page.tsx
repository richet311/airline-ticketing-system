import { Suspense } from "react";
import Link from "next/link";

import { SiteHeader } from "@/components/SiteHeader";
import { BookingStatusPill, Card, LegSummary, TripNotFound, travelerName } from "@/components/trips/TripParts";
import { cancelProblem, CHECK_IN_OPENS_MINUTES, checkInProblem, legChangeProblem } from "@/lib/bookingRules";
import { formatDate, formatMoney } from "@/lib/format";
import { getTrip, legLabel } from "@/lib/trips";

type SearchParams = { [key: string]: string | string[] | undefined };

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CREDIT: "Credit card",
  DEBIT: "Debit card",
  PAYPAL: "PayPal",
};

// shown after the cancel and change pages send the customer back here
const NOTICES: Record<string, string> = {
  cancelled: "Your trip is cancelled. Your refund is on its way to your original payment method.",
  changed: "Your flight is changed. Your new flight and seats are below.",
};

export default function TripDetailsPage({ params, searchParams }: PageProps<"/my-trips/[bookingId]">) {
  return (
    <>
      <SiteHeader active="my-trips" />

      <main className="flex-1 bg-azure-page">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
          <Link href="/my-trips" className="text-sm font-semibold text-azure-blue hover:underline">
            ← My Trips
          </Link>
          <Suspense fallback={<p className="text-gray-500">Loading your trip...</p>}>
            <TripDetails params={params} searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function TripDetails({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const bookingId = (await params).bookingId.toUpperCase();
  const done = (await searchParams).done;
  const notice = typeof done === "string" ? NOTICES[done] : undefined;

  const trip = await getTrip(bookingId);
  if (!trip) return <TripNotFound bookingId={bookingId} backHref="/my-trips" />;
  const { booking, legs, payments, upgrades } = trip;

  const tickets = legs.flatMap((leg) => leg.tickets);
  const travelers = new Set(tickets.map((ticket) => ticket.passenger_id)).size;
  const fareTotal = tickets.reduce((sum, ticket) => sum + ticket.flight_fare, 0);
  const bagCount = tickets.reduce((sum, ticket) => sum + ticket.bag_count, 0);
  const bagFees = tickets.reduce((sum, ticket) => sum + ticket.bag_fees, 0);

  const confirmed = booking.booking_status_name === "CONFIRMED";
  const canCheckIn = confirmed && legs.some((leg) => checkInProblem(leg.flight) === null);
  const checkInLater = confirmed && !canCheckIn && legs.some((leg) => leg.flight.minutes_to_departure > CHECK_IN_OPENS_MINUTES);
  const changeable = confirmed && legs.some((leg) => legChangeProblem(leg.tickets) === null);
  const cancelBlocked = cancelProblem(booking.booking_status_name, legs.map((leg) => leg.tickets));

  const first = legs[0]?.flight;
  const tripKind = legs.length === 1 ? "One way" : legLabel(legs, 1) === "Return" ? "Round trip" : `${legs.length} flights`;

  return (
    <>
      {notice && (
        <p role="status" className="rounded-card border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {notice}
        </p>
      )}

      <section className="flex flex-wrap items-center justify-between gap-8 rounded-card border border-gray-200 bg-white p-8 shadow-card">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-[13px] font-semibold tracking-widest text-azure-navy uppercase">Your trip</p>
            <BookingStatusPill status={booking.booking_status_name} />
          </div>
          <h1 className="mt-2 text-3xl leading-tight font-light text-balance text-azure-navy">
            {first ? `${first.origin_city} to ${first.destination_city}` : "Trip details"}
          </h1>
          <div className="mt-5 h-[3px] w-14 bg-azure-blue" />
          <p className="mt-5 text-gray-700">
            {tripKind} · {travelers} {travelers === 1 ? "traveler" : "travelers"} · Booked{" "}
            {formatDate(booking.created_at)} by {travelerName({ first_name: booking.booker_first_name, last_name: booking.booker_last_name })}
          </p>
        </div>
        <div className="shrink-0 rounded-card border border-gray-200 bg-azure-page px-8 py-6 text-center">
          <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase">Confirmation code</p>
          <p className="mt-1 font-mono text-4xl font-semibold tracking-[0.2em] text-azure-navy">{booking.booking_id}</p>
        </div>
      </section>

      {legs.map((leg, i) => (
        <Card key={leg.flight.flight_id}>
          <LegSummary label={legLabel(legs, i)} flight={leg.flight} />

          <table className="mt-5 w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-[11px] tracking-widest text-gray-600 uppercase">
                <th className="py-2 font-semibold">Traveler</th>
                <th className="py-2 font-semibold">Seat</th>
                <th className="py-2 font-semibold">Checked bags</th>
                <th className="py-2 font-semibold">Check-in</th>
                <th className="py-2 text-right font-semibold">E-ticket</th>
              </tr>
            </thead>
            <tbody>
              {leg.tickets.map((ticket) => (
                <tr key={ticket.e_ticket_number} className="border-b border-gray-100 last:border-b-0">
                  <td className="py-2 text-gray-900">{travelerName(ticket)}</td>
                  <td className="py-2 text-gray-700">{ticket.seat_number ?? "None"}</td>
                  <td className="py-2 text-gray-700">{ticket.bag_count}</td>
                  <td className="py-2 text-gray-700">
                    {ticket.boarded === 1 ? "Boarded" : ticket.checked_in === 1 ? "Checked in" : "Not yet"}
                  </td>
                  <td className="py-2 text-right font-mono text-gray-700">{ticket.e_ticket_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-azure-navy">Payment</h2>
        <div className="space-y-1 text-sm">
          <PriceLine label={`Fares (${tickets.length} ${tickets.length === 1 ? "ticket" : "tickets"})`} amount={fareTotal} />
          {bagCount > 0 && <PriceLine label={`Checked bags (${bagCount})`} amount={bagFees} />}
          {upgrades.map((upgrade) => (
            <PriceLine key={upgrade.upgrade_id} label={upgrade.upgrade_name} amount={upgrade.upgrade_price} />
          ))}
          <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-azure-navy">
            <span>Trip total</span>
            <span>{formatMoney(booking.total_amount, booking.currency)}</span>
          </div>
        </div>

        {payments.length > 0 && (
          <>
            <h3 className="mt-6 mb-2 text-[11px] font-semibold tracking-widest text-gray-600 uppercase">Payment history</h3>
            <ul className="space-y-1 text-sm">
              {payments.map((payment) => (
                <li key={payment.payment_id} className="flex justify-between gap-3 text-gray-700">
                  <span>
                    {payment.payment_status === "REFUNDED" ? "Refund" : payment.payment_status === "PENDING" ? "Pending" : "Paid"} ·{" "}
                    {PAYMENT_METHOD_LABELS[payment.payment_method] ?? payment.payment_method}
                    {payment.payment_time && ` · ${formatDate(payment.payment_time)}`}
                  </span>
                  <span className={payment.payment_status === "REFUNDED" ? "text-green-700" : ""}>
                    {payment.payment_status === "REFUNDED" ? "−" : ""}
                    {formatMoney(payment.total_amount, booking.currency)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-sm font-semibold text-gray-900">
              <span>Paid so far</span>
              <span>{formatMoney(booking.paid_amount, booking.currency)}</span>
            </p>
          </>
        )}
      </Card>

      {booking.booking_status_name !== "CANCELLED" && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-azure-navy">Manage this trip</h2>
          <div className="flex flex-wrap gap-3">
            {canCheckIn && (
              <Link
                href={`/check-in/${booking.booking_id}`}
                className="rounded-control bg-azure-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-azure-blue-dark"
              >
                Check in
              </Link>
            )}
            {changeable && (
              <Link
                href={`/my-trips/${booking.booking_id}/change`}
                className="rounded-control border border-azure-blue px-6 py-2.5 text-sm font-semibold text-azure-blue hover:bg-azure-blue hover:text-white"
              >
                Change flight
              </Link>
            )}
            {!cancelBlocked && (
              <Link
                href={`/my-trips/${booking.booking_id}/cancel`}
                className="rounded-control border border-red-600 px-6 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-600 hover:text-white"
              >
                Cancel trip
              </Link>
            )}
          </div>
          {checkInLater && <p className="mt-3 text-sm text-gray-500">Check-in opens 24 hours before departure.</p>}
          {cancelBlocked && <p className="mt-3 text-sm text-gray-500">{cancelBlocked}</p>}
        </Card>
      )}
    </>
  );
}

function PriceLine({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between gap-3 text-gray-700">
      <span>{label}</span>
      <span>{formatMoney(amount)}</span>
    </div>
  );
}
