"use client";

import { useState, useTransition } from "react";

import { confirmBookingChanges, type BookingChange } from "@/app/employee/agent/bookings/[bookingId]/actions";
import { AdminTable, adminButtonClass, adminInputClass } from "@/components/admin/AdminTile";
import {
  BAG_FLIGHT_STATUSES,
  bagFeeAt,
  bagWeightProblem,
  cabinChangeCost,
  CHANGEABLE_FLIGHT_STATUSES,
  cancellationRefund,
  roundCents,
  statusChangeProblem,
} from "@/lib/bookingRules";
import { formatMoney, formatMonthDay, formatTime } from "@/lib/format";
import type { AgentFareRow, BookingTicketRow } from "@/lib/types";

//Logic for booking tile confirmation

const CONFIRM_MESSAGE =
  "Are you sure you and the customer are in agreement with the following changes to their booking? Click yes to charge their accounts for upgrades or refund if necessary.";

type Staged = {
  status: Record<string, string>;
  fare: Record<string, string>;
  seat: Record<string, string>;
  bags: Record<string, number[]>;
};
const NOTHING_STAGED: Staged = { status: {}, fare: {}, seat: {}, bags: {} };

const stagedClass = "border-amber-400 bg-amber-50";

export function BookingsEditor({
  tickets,
  fares,
  seatsByFare,
  bagWeights,
  statuses,
}: {
  tickets: BookingTicketRow[];
  fares: AgentFareRow[];
  seatsByFare: Record<number, string[]>;
  bagWeights: Record<string, number[]>;
  statuses: string[];
}) {
  const [staged, setStaged] = useState<Staged>(NOTHING_STAGED);
  const [weightDrafts, setWeightDrafts] = useState<Record<string, string>>({});
  const [asking, setAsking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const fareById = new Map(fares.map((fare) => [fare.fare_class_id, fare]));
  const bookings = new Map<string, BookingTicketRow[]>();
  for (const ticket of tickets) bookings.set(ticket.booking_id, [...(bookings.get(ticket.booking_id) ?? []), ticket]);

  const statusOf = (ticket: BookingTicketRow) => staged.status[ticket.booking_id] ?? ticket.booking_status_name;
  const fareOf = (ticket: BookingTicketRow) => staged.fare[ticket.e_ticket_number] ?? String(ticket.fare_class_id);
  const seatOf = (ticket: BookingTicketRow) => staged.seat[ticket.e_ticket_number] ?? ticket.seat_number ?? "";
  const newBags = (ticket: BookingTicketRow) => staged.bags[ticket.e_ticket_number] ?? [];
  const seatMoved = (ticket: BookingTicketRow) =>
    fareOf(ticket) !== String(ticket.fare_class_id) || seatOf(ticket) !== (ticket.seat_number ?? "");
  const cabinChanged = (ticket: BookingTicketRow) => fareOf(ticket) !== String(ticket.fare_class_id);
  const newPrice = (ticket: BookingTicketRow) => fareById.get(Number(fareOf(ticket)))?.base_price ?? 0;
  const oldChangeFee = (ticket: BookingTicketRow) => fareById.get(ticket.fare_class_id)?.change_fee ?? 0;

  const bookingLocked = (ticket: BookingTicketRow) => ticket.booking_status_name === "CANCELLED" || statusOf(ticket) === "CANCELLED";
  const ticketLocked = (ticket: BookingTicketRow) =>
    bookingLocked(ticket) || !CHANGEABLE_FLIGHT_STATUSES.includes(ticket.flight_status_name) || ticket.seat_number === null;
  //Bags can be adjusted right up until the aircraft takes off
  const bagsLocked = (ticket: BookingTicketRow) =>
    bookingLocked(ticket) || !BAG_FLIGHT_STATUSES.includes(ticket.flight_status_name);

  //calculating the cost
  function preview(bookingTickets: BookingTicketRow[]) {
    const first = bookingTickets[0];
    if (first.booking_status_name !== "CANCELLED" && statusOf(first) === "CANCELLED") {
      const refund = cancellationRefund(first.paid_amount);
      return { total: roundCents(first.paid_amount - refund), difference: -refund };
    }
    let difference = 0;
    for (const ticket of bookingTickets) {
      if (cabinChanged(ticket)) difference += cabinChangeCost(ticket.flight_fare, newPrice(ticket), oldChangeFee(ticket));
      else if (seatMoved(ticket)) difference += newPrice(ticket) - ticket.flight_fare;
      const existing = bagWeights[ticket.e_ticket_number]?.length ?? 0;
      newBags(ticket).forEach((_, i) => (difference += bagFeeAt(existing + i)));
    }
    difference = roundCents(difference);
    return { total: roundCents(first.total_amount + difference), difference };
  }

  function changesToSave(): BookingChange[] {
    const changes: BookingChange[] = [];
    for (const [bookingId, bookingTickets] of bookings) {
      const first = bookingTickets[0];
      const status = statusOf(first) !== first.booking_status_name ? statusOf(first) : null;
      const moved = status === "CANCELLED" ? [] : bookingTickets.filter(seatMoved);
      const bagged = status === "CANCELLED" ? [] : bookingTickets.filter((ticket) => newBags(ticket).length > 0);
      if (status === null && moved.length === 0 && bagged.length === 0) continue;
      changes.push({
        bookingId,
        status,
        tickets: moved.map((ticket) => ({ eTicket: ticket.e_ticket_number, fareClassId: Number(fareOf(ticket)), seatNumber: seatOf(ticket) })),
        bags: bagged.map((ticket) => ({ eTicket: ticket.e_ticket_number, weights: newBags(ticket) })),
      });
    }
    return changes;
  }

  function stage(update: (draft: Staged) => void) {
    const next: Staged = {
      status: { ...staged.status },
      fare: { ...staged.fare },
      seat: { ...staged.seat },
      bags: { ...staged.bags },
    };
    update(next);
    setStaged(next);
    setMessage(null);
  }

  function changeStatus(bookingTickets: BookingTicketRow[], value: string) {
    stage((draft) => {
      if (value === bookingTickets[0].booking_status_name) delete draft.status[bookingTickets[0].booking_id];
      else draft.status[bookingTickets[0].booking_id] = value;
      // cancelling drops the booking's other staged changes
      if (value === "CANCELLED") {
        for (const ticket of bookingTickets) {
          delete draft.fare[ticket.e_ticket_number];
          delete draft.seat[ticket.e_ticket_number];
          delete draft.bags[ticket.e_ticket_number];
        }
      }
    });
  }

  // A new cabin always needs a new seat, so the seat open starts out as blank until one is selected
  function changeFare(ticket: BookingTicketRow, value: string) {
    stage((draft) => {
      if (value === String(ticket.fare_class_id)) {
        delete draft.fare[ticket.e_ticket_number];
        delete draft.seat[ticket.e_ticket_number];
      } else {
        draft.fare[ticket.e_ticket_number] = value;
        draft.seat[ticket.e_ticket_number] = "";
      }
    });
  }

  function changeSeat(ticket: BookingTicketRow, value: string) {
    stage((draft) => {
      if (value === ticket.seat_number && fareOf(ticket) === String(ticket.fare_class_id)) delete draft.seat[ticket.e_ticket_number];
      else draft.seat[ticket.e_ticket_number] = value;
    });
  }

  function addBag(ticket: BookingTicketRow) {
    const weight = Number(weightDrafts[ticket.e_ticket_number]);
    const problem = bagWeightProblem(weight);
    if (problem) {
      setMessage(`${ticket.booking_id}: ${problem}`);
      return;
    }
    stage((draft) => {
      draft.bags[ticket.e_ticket_number] = [...newBags(ticket), roundCents(weight)];
    });
    setWeightDrafts({ ...weightDrafts, [ticket.e_ticket_number]: "" });
  }
  //confirmation question
  function askToConfirm() {
    const missingSeat = tickets.find((ticket) => !bookingLocked(ticket) && staged.seat[ticket.e_ticket_number] === "");
    if (missingSeat) {
      setMessage(`${missingSeat.booking_id}: pick a seat in the new cabin for ${missingSeat.first_name} ${missingSeat.last_name}.`);
      return;
    }
    setAsking(true);
  }

  //not confirmed
  function revertAll() {
    setAsking(false);
    setStaged(NOTHING_STAGED);
    setWeightDrafts({});
    setMessage(null);
  }

  function saveAll() {
    setAsking(false);
    startTransition(async () => {
      const result = await confirmBookingChanges(changesToSave());
      if (result.ok) {
        setStaged(NOTHING_STAGED);
        setMessage(null);
      } else {
        setMessage(result.error);
      }
    });
  }

  const changes = changesToSave();
  const readOnly = "py-2 pr-4 text-gray-500";

  return (
    <>
      <AdminTable headings={["Booking", "Flight", "Route", "Passenger", "Departs", "Fare class", "Seat", "Bags", "Total", "Status"]}>
        {[...bookings.values()].map((bookingTickets) => {
          const first = bookingTickets[0];
          const after = preview(bookingTickets);
          const span = bookingTickets.length;
          const statusStaged = statusOf(first) !== first.booking_status_name;

          return bookingTickets.map((ticket, i) => {
            const locked = ticketLocked(ticket);
            const fareId = fareOf(ticket);
            const seat = seatOf(ticket);
            //filtering for available seats
            const fareChoices = fares.filter(
              (fare) => fare.flight_id === ticket.flight_id && (fare.seats_available > 0 || fare.fare_class_id === ticket.fare_class_id),
            );
            const takenByOthers = new Set(
              tickets.filter((other) => other !== ticket && other.flight_id === ticket.flight_id && seatMoved(other)).map(seatOf),
            );
            const seatChoices = [
              ...(fareId === String(ticket.fare_class_id) && ticket.seat_number ? [ticket.seat_number] : []),
              ...(seatsByFare[Number(fareId)] ?? []).filter((number) => !takenByOthers.has(number)),
            ];
            const savedBags = bagWeights[ticket.e_ticket_number] ?? [];

            return (
              <tr key={ticket.e_ticket_number} className="align-top">
                {i === 0 && (
                  <td rowSpan={span} className="py-2 pr-4 font-semibold text-gray-900">
                    {first.booking_id}
                  </td>
                )}
                <td className={readOnly}>{ticket.flight_number}</td>
                <td className={`${readOnly} whitespace-nowrap`}>
                  {ticket.origin} → {ticket.destination}
                </td>
                <td className={readOnly}>
                  {ticket.first_name} {ticket.last_name}
                </td>
                <td className={`${readOnly} whitespace-nowrap`}>
                  {formatMonthDay(ticket.departure_time, ticket.origin_timezone)},{" "}
                  {formatTime(ticket.departure_time, ticket.origin_timezone)}
                </td>
                <td className="py-2 pr-4">
                  <select
                    value={fareId}
                    disabled={locked || pending}
                    onChange={(event) => changeFare(ticket, event.target.value)}
                    className={`${adminInputClass} ${fareId !== String(ticket.fare_class_id) ? stagedClass : ""}`}
                  >
                    {fareChoices.map((fare) => (
                      <option key={fare.fare_class_id} value={fare.fare_class_id}>
                        {fare.cabin_class_name} · {formatMoney(fare.base_price)}
                      </option>
                    ))}
                  </select>
                  {cabinChanged(ticket) && (
                    <p className="mt-1 text-xs text-amber-700">+ {formatMoney(oldChangeFee(ticket))} change fee</p>
                  )}
                </td>
                <td className="py-2 pr-4">
                  <select
                    value={seat}
                    disabled={locked || pending}
                    onChange={(event) => changeSeat(ticket, event.target.value)}
                    className={`${adminInputClass} w-24 ${seatMoved(ticket) ? stagedClass : ""}`}
                  >
                    {seat === "" && (
                      <option value="" disabled>
                        {ticket.seat_number === null ? "None" : "Pick"}
                      </option>
                    )}
                    {seatChoices.map((number) => (
                      <option key={number}>{number}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-4 text-xs whitespace-nowrap">
                  {savedBags.length === 0 && newBags(ticket).length === 0 && <p className="text-gray-500">No bags</p>}
                  {savedBags.map((weight, n) => (
                    <p key={n} className="text-gray-700">
                      Bag {n + 1} · {weight} lb
                    </p>
                  ))}
                  {newBags(ticket).map((weight, n) => (
                    <p key={`new${n}`} className="text-amber-700">
                      Bag {savedBags.length + n + 1} · {weight} lb (new, {formatMoney(bagFeeAt(savedBags.length + n))})
                    </p>
                  ))}
                  <div className="mt-1 flex gap-1">
                    <input
                      type="number"
                      min={0.1}
                      max={100}
                      step={0.1}
                      placeholder="lb"
                      aria-label={`New bag weight for ${ticket.first_name} ${ticket.last_name}`}
                      value={weightDrafts[ticket.e_ticket_number] ?? ""}
                      disabled={bagsLocked(ticket) || pending}
                      onChange={(event) => setWeightDrafts({ ...weightDrafts, [ticket.e_ticket_number]: event.target.value })}
                      className={`${adminInputClass} h-7 w-16`}
                    />
                    <button
                      type="button"
                      disabled={bagsLocked(ticket) || pending}
                      onClick={() => addBag(ticket)}
                      className={`${adminButtonClass} h-7 px-2 text-xs disabled:bg-gray-300`}
                    >
                      + Bag
                    </button>
                  </div>
                </td>
                {i === 0 && (
                  <>
                    <td rowSpan={span} className="py-2 pr-4 whitespace-nowrap">
                      {after.difference === 0 && !statusStaged ? (
                        <span className="text-gray-500">{formatMoney(first.total_amount)}</span>
                      ) : (
                        <span className="text-amber-700">
                          {formatMoney(first.total_amount)} → {formatMoney(after.total)}
                          <br />
                          {after.difference > 0 && `charge ${formatMoney(after.difference)}`}
                          {after.difference < 0 && `refund ${formatMoney(-after.difference)}`}
                        </span>
                      )}
                    </td>
                    <td rowSpan={span} className="py-2 pr-4">
                      <select
                        value={statusOf(first)}
                        disabled={first.booking_status_name === "CANCELLED" || pending}
                        onChange={(event) => changeStatus(bookingTickets, event.target.value)}
                        className={`${adminInputClass} ${statusStaged ? stagedClass : ""}`}
                      >
                        {statuses.map((name) => (
                          <option key={name} disabled={statusChangeProblem(first.booking_status_name, name) !== null}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </>
                )}
              </tr>
            );
          });
        })}
      </AdminTable>

      <div className="mt-4 flex items-center gap-4">
        <button type="button" disabled={changes.length === 0 || pending} onClick={askToConfirm} className={`${adminButtonClass} disabled:bg-gray-300`}>
          {pending ? "Saving..." : "Confirm changes"}
        </button>
        <span className="text-sm text-gray-500">
          {changes.length === 0 ? "No changes yet." : `${changes.length} ${changes.length === 1 ? "booking" : "bookings"} changed.`}
        </span>
      </div>
      {message && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {message}
        </p>
      )}

      {asking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-card bg-white p-6">
            <p className="text-gray-900">{CONFIRM_MESSAGE}</p>
            <ul className="mt-4 space-y-1 text-sm text-gray-700">
              {changes.map((change) => {
                const bookingTickets = bookings.get(change.bookingId) ?? [];
                const after = preview(bookingTickets);
                return (
                  <li key={change.bookingId}>
                    <span className="font-semibold">{change.bookingId}</span>
                    {change.status && ` · ${change.status}`} · {formatMoney(bookingTickets[0].total_amount)} →{" "}
                    {formatMoney(after.total)}
                    {after.difference > 0 && ` · charge ${formatMoney(after.difference)}`}
                    {after.difference < 0 && ` · refund ${formatMoney(-after.difference)}`}
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={revertAll} className="h-9 rounded-control border border-gray-300 px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                No
              </button>
              <button type="button" onClick={saveAll} className={adminButtonClass}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
