// TODO: download pdf button from the mockup

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { connection } from "next/server";

import { SiteHeader } from "@/components/SiteHeader";
import { BoardingPass, type BoardingPassData } from "@/components/check-in/BoardingPass";
import { CheckInForm, type CheckInTraveler } from "@/components/check-in/CheckInForm";
import { CheckInLookupForm } from "@/components/check-in/CheckInLookupForm";
import { CheckCircleIcon } from "@/components/icons";
import {
  CHECK_IN_CLOSES_MINUTES,
  boardingGroup,
  boardingTime,
  checkInOpensAt,
  checkInState,
  travelerProblem,
  type CheckInState,
} from "@/lib/checkIn";
import { db } from "@/lib/db";
import { formatDate, formatTime } from "@/lib/format";
import { FLIGHT_STATUS } from "@/lib/statuses";
import { canOpenTrip } from "@/lib/tripAccess";
import type { CheckInTicket } from "@/lib/types";

export default function CheckInBookingPage({ params }: PageProps<"/check-in/[bookingId]">) {
  return (
    <>
      <SiteHeader active="check-in" />

      <main className="flex-1 bg-azure-page">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Suspense fallback={<p className="text-gray-500">Loading your booking...</p>}>
            <CheckIn params={params} />
          </Suspense>
        </div>
      </main>

    </>
  );
}

async function CheckIn({ params }: { params: Promise<{ bookingId: string }> }) {
  const bookingId = (await params).bookingId.toUpperCase();
  // has to run at request time
  await connection();

  // same card either way so people cant guess codes
  if (!/^[A-Z0-9]{6}$/.test(bookingId) || !(await canOpenTrip(bookingId))) {
    return <ConfirmItsYours bookingId={bookingId} />;
  }

  // gate can be null if not assigned yet
  const [tickets] = await db.query<CheckInTicket[]>(
    `SELECT t.e_ticket_number, t.seat_number, t.checked_in, b.booking_status_id,
            p.first_name, p.last_name, p.passport_number, p.passport_expiry_date,
            f.flight_id, f.flight_number, f.departure_time, f.flight_status_id,
            TIMESTAMPDIFF(MINUTE, NOW(), f.departure_time) AS minutes_to_departure,
            o.airport_code AS origin, o.city AS origin_city, o.country AS origin_country,
            o.timezone AS origin_timezone,
            d.airport_code AS destination, d.city AS destination_city, d.country AS destination_country,
            g.gate_number, tm.terminal_name, cc.cabin_class_name,
            (SELECT COUNT(*) FROM baggage bg WHERE bg.e_ticket_number = t.e_ticket_number) AS bag_count
       FROM ticket t
       JOIN booking b         ON b.booking_id = t.booking_id
       JOIN passenger p       ON p.passenger_id = t.passenger_id
       JOIN flight f          ON f.flight_id = t.flight_id
       JOIN airport o         ON o.airport_id = f.origin_airport_id
       JOIN airport d         ON d.airport_id = f.destination_airport_id
       LEFT JOIN gate g       ON g.gate_id = f.departure_gate_id
       LEFT JOIN terminal tm  ON tm.terminal_id = g.terminal_id
       JOIN fare_class fc     ON fc.fare_class_id = t.fare_class_id
       JOIN cabin_class cc    ON cc.cabin_class_id = fc.cabin_class_id
      WHERE t.booking_id = ?
      ORDER BY f.departure_time, t.e_ticket_number`,
    [bookingId],
  );
  if (tickets.length === 0) {
    return <Card>There are no tickets on booking {bookingId}.</Card>;
  }

  // next flight that hasnt left yet
  const flight = tickets.find(
    (ticket) => ticket.flight_status_id !== FLIGHT_STATUS.DEPARTED && ticket.flight_status_id !== FLIGHT_STATUS.ARRIVED,
  );
  if (!flight) {
    return <Card>Every flight on booking {bookingId} has already left. Have a good trip.</Card>;
  }
  const flightTickets = tickets.filter((ticket) => ticket.flight_id === flight.flight_id);

  const state = checkInState({
    bookingStatusId: flight.booking_status_id,
    flightStatusId: flight.flight_status_id,
    minutesToDeparture: flight.minutes_to_departure,
    allCheckedIn: flightTickets.every((ticket) => ticket.checked_in === 1),
  });

  const international = flight.origin_country !== flight.destination_country;
  const travelers: CheckInTraveler[] = flightTickets
    .filter((ticket) => ticket.checked_in !== 1)
    .map((ticket) => ({
      eTicketNumber: ticket.e_ticket_number,
      name: fullName(ticket),
      seat: ticket.seat_number,
      problem: travelerProblem({
        seatNumber: ticket.seat_number,
        international,
        passportNumber: ticket.passport_number,
        passportExpiry: ticket.passport_expiry_date,
        departureTime: ticket.departure_time,
      }),
    }));
  const checkedIn = flightTickets.filter((ticket) => ticket.checked_in === 1);

  const blocked = state === "unpaid" || state === "booking-cancelled" || state === "flight-cancelled";
  const when = `${formatDate(flight.departure_time, flight.origin_timezone)}, ${formatTime(flight.departure_time, flight.origin_timezone)}`;

  return (
    <div className={blocked ? "max-w-2xl" : "grid grid-cols-[minmax(0,1fr)_26rem] items-start gap-8"}>
      <section aria-labelledby="check-in-heading" className="space-y-4">
        <div>
          <h1 id="check-in-heading" className="text-4xl font-semibold text-azure-navy">
            Check in
          </h1>
          <p className="mt-2 text-[15px] text-gray-600">
            <span className="font-mono">{bookingId}</span> · {spaced(flight.flight_number)} · {flight.origin} →{" "}
            {flight.destination} · {when}
          </p>
        </div>

        <StateNotice state={state} flight={flight} bookingId={bookingId} checkedIn={checkedIn.length} total={flightTickets.length} />

        {!blocked && (
          <>
            <TaskList flightTickets={flightTickets} international={international} />
            {state === "open" && <CheckInForm bookingId={bookingId} travelers={travelers} />}
          </>
        )}
      </section>

      {!blocked && (
        <aside aria-labelledby="pass-heading" className="space-y-4">
          <h2 id="pass-heading" className="text-xl font-semibold text-azure-navy">
            {checkedIn.length > 1 ? "Boarding passes" : "Boarding pass"}
          </h2>
          {checkedIn.length > 0 ? (
            checkedIn.map((ticket) => <BoardingPass key={ticket.e_ticket_number} pass={toPass(ticket)} />)
          ) : (
            <BoardingPass pass={toPass(flightTickets[0])} preview />
          )}
          <p className="text-sm text-gray-600">
            Boarding closes 15 minutes before departure. Gates can change, so check{" "}
            <Link href="/flight-status" className="font-semibold text-azure-blue hover:underline">
              Flight Status
            </Link>{" "}
            before you go.
          </p>
        </aside>
      )}
    </div>
  );
}

function StateNotice({
  state,
  flight,
  bookingId,
  checkedIn,
  total,
}: {
  state: CheckInState;
  flight: CheckInTicket;
  bookingId: string;
  checkedIn: number;
  total: number;
}) {
  const number = spaced(flight.flight_number);
  const zone = flight.origin_timezone;

  switch (state) {
    case "done":
      return (
        <Notice tone="green">
          <CheckCircleIcon className="mr-1 inline h-5 w-5 align-[-4px]" />
          You&apos;re checked in for {number}. Show your boarding {total > 1 ? "passes" : "pass"} at security and at the
          gate.
        </Notice>
      );
    case "open":
      return checkedIn > 0 ? (
        <Notice tone="blue">
          {checkedIn} of {total} travelers checked in. Check in the rest below.
        </Notice>
      ) : null;
    case "not-open": {
      const opens = checkInOpensAt(flight.departure_time);
      return (
        <Notice tone="amber">
          Check-in for {number} opens 24 hours before departure, on {formatDate(opens, zone)} at {formatTime(opens, zone)}.
        </Notice>
      );
    }
    case "delayed":
      return (
        <Notice tone="amber">
          {number} is delayed. Check-in reopens once the flight has a new departure time.{" "}
          <Link href="/flight-status" className="font-semibold underline">
            Flight status
          </Link>
        </Notice>
      );
    case "closed":
      return (
        <Notice tone="blue">
          Check-in for {number} has closed.{" "}
          {flight.flight_status_id === FLIGHT_STATUS.BOARDING
            ? `The flight is boarding${flight.gate_number ? ` at gate ${flight.gate_number}` : ""}.`
            : flight.flight_status_id === FLIGHT_STATUS.SCHEDULED
              ? `It closes ${CHECK_IN_CLOSES_MINUTES} minutes before departure. Please see an agent at the airport.`
              : "This flight has already left."}
        </Notice>
      );
    case "flight-cancelled":
      return (
        <Notice tone="red">
          {number} was cancelled, so you can&apos;t check in.{" "}
          <Link href={`/my-trips/${bookingId}`} className="font-semibold underline">
            See your refund options in My Trips
          </Link>
        </Notice>
      );
    case "unpaid":
      return <Notice tone="red">This booking isn&apos;t confirmed yet. Finish payment before you check in.</Notice>;
    case "booking-cancelled":
      return <Notice tone="red">This booking was cancelled, so there&apos;s nothing to check in.</Notice>;
  }
}

function TaskList({ flightTickets, international }: { flightTickets: CheckInTicket[]; international: boolean }) {
  const names = flightTickets.map(fullName);
  const bags = flightTickets.reduce((sum, ticket) => sum + ticket.bag_count, 0);
  const seats = flightTickets.map((ticket) => ticket.seat_number).filter((seat) => seat !== null);
  const noSeat = flightTickets.filter((ticket) => ticket.seat_number === null).map(fullName);
  const noPassport = international
    ? flightTickets
        .filter(
          (ticket) =>
            !ticket.passport_number ||
            !ticket.passport_expiry_date ||
            ticket.passport_expiry_date <= ticket.departure_time.slice(0, 10),
        )
        .map(fullName)
    : [];

  return (
    <ol className="space-y-3">
      <Task number={1} title="Passengers" status="Confirmed">
        {names.join(", ")}. {names.length > 1 ? "Names must match each traveler's ID." : "Name must match your ID."}
      </Task>

      {international ? (
        noPassport.length === 0 ? (
          <Task number={2} title="Travel documents" status="On file">
            International flight: a valid passport is on file for {names.length > 1 ? "every traveler" : "you"}.
          </Task>
        ) : (
          <Task number={2} title="Travel documents" status="Needed" problem>
            International flight: a valid passport is missing for {noPassport.join(", ")}. Add it in Account before you
            check in.
          </Task>
        )
      ) : (
        <Task number={2} title="Travel documents" status="Not needed">
          Domestic flight: a government photo ID is enough. A passport is only needed for international trips.
        </Task>
      )}

      <Task number={3} title="Bags" status={bags === 0 ? "None" : `${bags} ${bags === 1 ? "bag" : "bags"}`}>
        {bags === 0
          ? "No checked bags on this booking. You can add bags at the airport counter."
          : `${bags} checked ${bags === 1 ? "bag" : "bags"} prepaid. Weight and bag tag are added when you drop ${bags === 1 ? "it" : "them"} at the counter.`}
      </Task>

      {noSeat.length === 0 ? (
        <Task number={4} title="Seat" status="Assigned">
          {seats.length > 1 ? `Seats ${seats.join(", ")}.` : `Seat ${seats[0]}.`}
        </Task>
      ) : (
        <Task number={4} title="Seat" status="Missing" problem>
          No seat for {noSeat.join(", ")}. Please see an agent at the airport.
        </Task>
      )}
    </ol>
  );
}

function Task({
  number,
  title,
  status,
  problem = false,
  children,
}: {
  number: number;
  title: string;
  status: string;
  problem?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-4 rounded-card border border-gray-200 bg-white px-5 py-4 shadow-card">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          problem ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
        }`}
      >
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-[15px] font-semibold text-azure-navy">{title}</h3>
          <span className={`shrink-0 text-xs font-semibold ${problem ? "text-red-700" : "text-green-700"}`}>{status}</span>
        </div>
        <p className="mt-1 text-sm text-gray-600">{children}</p>
      </div>
    </li>
  );
}

function Notice({ tone, children }: { tone: "green" | "amber" | "red" | "blue"; children: ReactNode }) {
  const colors = {
    green: "border-green-200 bg-green-50 text-green-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-700",
    blue: "border-blue-200 bg-azure-sky text-azure-navy",
  };
  return (
    <p role="status" className={`rounded-control border px-4 py-3 text-[15px] ${colors[tone]}`}>
      {children}
    </p>
  );
}

function ConfirmItsYours({ bookingId }: { bookingId: string }) {
  return (
    <section
      aria-labelledby="confirm-heading"
      className="mx-auto max-w-lg rounded-card border border-t-4 border-gray-200 border-t-azure-blue bg-white p-10 shadow-card"
    >
      <h1 id="confirm-heading" className="text-3xl font-semibold text-azure-navy">
        Find your trip
      </h1>
      <p className="mt-2 mb-8 text-[15px] text-gray-600">
        Enter the last name on the booking to check in. Or{" "}
        <Link href="/login" className="font-semibold text-azure-blue hover:underline">
          log in
        </Link>{" "}
        to see your trips.
      </p>
      <CheckInLookupForm initialCode={/^[A-Z0-9]{6}$/.test(bookingId) ? bookingId : ""} />
    </section>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <p className="mx-auto max-w-2xl rounded-card border border-gray-200 bg-white p-6 text-gray-700 shadow-card">
      {children}
      <Link href="/check-in" className="ml-2 font-semibold text-azure-blue hover:underline">
        Look up another trip
      </Link>
    </p>
  );
}

function toPass(ticket: CheckInTicket): BoardingPassData {
  return {
    eTicketNumber: ticket.e_ticket_number,
    passengerName: `${ticket.last_name ?? ""} / ${ticket.first_name ?? ""}`.toUpperCase(),
    flightNumber: ticket.flight_number,
    origin: ticket.origin,
    originCity: ticket.origin_city,
    destination: ticket.destination,
    destinationCity: ticket.destination_city,
    departureTime: ticket.departure_time,
    boardingTime: boardingTime(ticket.departure_time),
    timeZone: ticket.origin_timezone,
    gate: ticket.gate_number,
    seat: ticket.seat_number,
    cabin: ticket.cabin_class_name,
    group: boardingGroup(ticket.cabin_class_name),
  };
}

function fullName(ticket: CheckInTicket): string {
  return [ticket.first_name, ticket.last_name].filter(Boolean).join(" ");
}

// "AZ350" -> "AZ 350"
function spaced(flightNumber: string): string {
  return flightNumber.replace(/^([A-Z]+)/, "$1 ");
}
