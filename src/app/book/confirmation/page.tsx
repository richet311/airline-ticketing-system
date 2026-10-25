// TODO: only show this to the customer who made the booking

import { Suspense, type ReactNode } from "react";
import Link from "next/link";

import { SiteHeader } from "@/components/SiteHeader";
import { CheckCircleIcon } from "@/components/icons";
import { db } from "@/lib/db";
import type { BookingSummary, ConfirmationTicket, Payment, UpgradeType } from "@/lib/types";

type SearchParams = { [key: string]: string | string[] | undefined };

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CREDIT: "Credit card",
  DEBIT: "Debit card",
  PAYPAL: "PayPal",
};

export default function ConfirmationPage({ searchParams }: PageProps<"/book/confirmation">) {
  return (
    <>
      <SiteHeader active="book" />

      <main className="flex-1 bg-azure-page">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
          <Suspense fallback={<p className="text-gray-500">Loading your booking...</p>}>
            <Confirmation searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function Confirmation({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const value = params.booking;
  const bookingId = (Array.isArray(value) ? value[0] : (value ?? "")).trim().toUpperCase();

  const [bookings] = await db.query<BookingSummary[]>(
    `SELECT b.booking_id, bs.booking_status_name, b.total_amount, b.currency, b.created_at
       FROM booking b
       JOIN booking_status bs ON bs.booking_status_id = b.booking_status_id
      WHERE b.booking_id = ?`,
    [bookingId],
  );
  if (bookings.length === 0) {
    return (
      <Card>
        <p className="text-gray-600">
          We couldn&apos;t find a booking with confirmation code {bookingId || "(none)"}.{" "}
          <Link href="/my-trips" className="font-semibold text-azure-blue hover:underline">
            Look it up in My Trips
          </Link>
        </p>
      </Card>
    );
  }
  const booking = bookings[0];

  // one row per ticket, with its bag count and fees
  const [tickets] = await db.query<ConfirmationTicket[]>(
    `SELECT t.e_ticket_number, t.passenger_id, p.first_name, p.last_name, t.seat_number, t.flight_fare,
            f.flight_id, f.flight_number, f.departure_time, f.arrival_time,
            o.airport_code AS origin, d.airport_code AS destination, cc.cabin_class_name,
            COALESCE(bg.bag_count, 0) AS bag_count, COALESCE(bg.bag_fees, 0) AS bag_fees
       FROM ticket t
       JOIN passenger p    ON p.passenger_id = t.passenger_id
       JOIN flight f       ON f.flight_id = t.flight_id
       JOIN airport o      ON o.airport_id = f.origin_airport_id
       JOIN airport d      ON d.airport_id = f.destination_airport_id
       JOIN fare_class fc  ON fc.fare_class_id = t.fare_class_id
       JOIN cabin_class cc ON cc.cabin_class_id = fc.cabin_class_id
       LEFT JOIN (SELECT e_ticket_number, COUNT(*) AS bag_count, SUM(fee) AS bag_fees
                    FROM baggage GROUP BY e_ticket_number) bg ON bg.e_ticket_number = t.e_ticket_number
      WHERE t.booking_id = ?
      ORDER BY f.departure_time, t.e_ticket_number`,
    [bookingId],
  );

  const [upgrades] = await db.query<UpgradeType[]>(
    `SELECT ut.upgrade_id, ut.upgrade_name, ut.upgrade_description, ut.upgrade_price
       FROM booking_upgrade bu
       JOIN upgrade_type ut ON ut.upgrade_id = bu.upgrade_id
      WHERE bu.booking_id = ?
      ORDER BY ut.upgrade_name`,
    [bookingId],
  );

  const [payments] = await db.query<Payment[]>(
    "SELECT * FROM payment WHERE booking_id = ? ORDER BY payment_id DESC LIMIT 1",
    [bookingId],
  );
  const payment = payments[0];

  const flightIds = [...new Set(tickets.map((ticket) => ticket.flight_id))];
  const flights = flightIds.map((flightId) => tickets.filter((ticket) => ticket.flight_id === flightId));

  const confirmed = booking.booking_status_name === "CONFIRMED";
  const bagCount = tickets.reduce((sum, ticket) => sum + ticket.bag_count, 0);
  const bagFees = tickets.reduce((sum, ticket) => sum + ticket.bag_fees, 0);
  const fareTotal = tickets.reduce((sum, ticket) => sum + ticket.flight_fare, 0);

  return (
    <>
      <section className="flex items-center justify-between gap-8 rounded-card border border-gray-200 bg-white p-8 shadow-card">
        <div>
          <p
            className={`flex items-center gap-2 text-[13px] font-semibold tracking-widest uppercase ${
              confirmed ? "text-green-700" : "text-gray-500"
            }`}
          >
            {confirmed && <CheckCircleIcon className="h-5 w-5" />}
            {confirmed ? "Booking confirmed" : `Booking ${booking.booking_status_name.toLowerCase()}`}
          </p>
          <h1 className="mt-2 text-3xl leading-tight font-light text-balance text-azure-navy">
            {confirmed ? "You're booked! A great trip starts here." : "This booking isn't confirmed."}
          </h1>
          <div className="mt-5 h-[3px] w-14 bg-azure-blue" />
          <p className="mt-5 text-gray-700">
            Keep this code. With traveler 1&apos;s last name, it opens your trip in My Trips and Check In.
          </p>
        </div>
        <div className="shrink-0 rounded-card border border-gray-200 bg-azure-page px-8 py-6 text-center">
          <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase">Confirmation code</p>
          <p className="mt-1 font-mono text-4xl font-semibold tracking-[0.2em] text-azure-navy">{booking.booking_id}</p>
        </div>
      </section>

      {flights.map((flightTickets, i) => {
        const flight = flightTickets[0];
        return (
          <Card key={flight.flight_id}>
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold tracking-widest text-gray-600 uppercase">
                  {flights.length === 1 ? "Flight" : i === 0 ? "Depart" : "Return"} · {flight.departure_time.slice(0, 10)}
                </p>
                <h2 className="text-xl font-semibold text-azure-navy">
                  {flight.origin} {flight.departure_time.slice(11, 16)} → {flight.destination}{" "}
                  {flight.arrival_time.slice(11, 16)} <span className="text-xs font-normal text-gray-500">UTC</span>
                </h2>
              </div>
              <p className="text-sm text-gray-500">
                {flight.flight_number} · {cabinLabel(flight.cabin_class_name)}
              </p>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-[11px] tracking-widest text-gray-600 uppercase">
                  <th className="py-2 font-semibold">Traveler</th>
                  <th className="py-2 font-semibold">Seat</th>
                  <th className="py-2 font-semibold">Checked bags</th>
                  <th className="py-2 text-right font-semibold">E-ticket</th>
                </tr>
              </thead>
              <tbody>
                {flightTickets.map((ticket) => (
                  <tr key={ticket.e_ticket_number} className="border-b border-gray-100 last:border-b-0">
                    <td className="py-2 text-gray-900">
                      {ticket.first_name} {ticket.last_name}
                    </td>
                    <td className="py-2 text-gray-700">{ticket.seat_number ?? "None"}</td>
                    <td className="py-2 text-gray-700">{ticket.bag_count}</td>
                    <td className="py-2 text-right font-mono text-gray-700">{ticket.e_ticket_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        );
      })}

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-azure-navy">Payment</h2>
        <div className="space-y-1 text-sm">
          <PriceLine label={`Fares (${tickets.length} ${tickets.length === 1 ? "ticket" : "tickets"})`} amount={fareTotal} />
          {bagCount > 0 && <PriceLine label={`Checked bags (${bagCount})`} amount={bagFees} />}
          {upgrades.map((upgrade) => (
            <PriceLine key={upgrade.upgrade_id} label={upgrade.upgrade_name} amount={upgrade.upgrade_price} />
          ))}
          <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-azure-navy">
            <span>Total</span>
            <span>
              {formatPrice(booking.total_amount)} {booking.currency}
            </span>
          </div>
        </div>
        {payment && (
          <p className="mt-3 text-xs text-gray-500">
            {PAYMENT_METHOD_LABELS[payment.payment_method] ?? payment.payment_method} ·{" "}
            {payment.payment_status === "RECEIVED" ? "Paid" : payment.payment_status.toLowerCase()}
            {payment.payment_time && ` ${payment.payment_time.slice(0, 16)} UTC`}
          </p>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/my-trips/${booking.booking_id}`}
          className="rounded-control bg-azure-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-azure-blue-dark"
        >
          View trip
        </Link>
        <Link
          href={`/check-in/${booking.booking_id}`}
          className="rounded-control border border-azure-blue px-6 py-2.5 text-sm font-semibold text-azure-blue hover:bg-azure-blue hover:text-white"
        >
          Check in
        </Link>
        <Link href="/" className="px-2 py-2.5 text-sm font-semibold text-azure-blue hover:underline">
          Book another trip
        </Link>
      </div>
      <p className="text-xs text-gray-500">Check-in opens 24 hours before departure.</p>
    </>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-card border border-gray-200 bg-white shadow-card p-6">{children}</section>;
}

function PriceLine({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between gap-3 text-gray-700">
      <span>{label}</span>
      <span>{formatPrice(amount)}</span>
    </div>
  );
}

// "ECONOMY" -> "Economy"
function cabinLabel(cabin: string): string {
  return cabin.charAt(0) + cabin.slice(1).toLowerCase();
}

// 467 -> "$467.00"
function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
