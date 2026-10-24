"use client";

import { useState, useTransition } from "react";

import {
  assignGate,
  boardPassenger,
  checkInPassenger,
  setGateStatus,
  type GateActionResult,
} from "@/app/employee/agent/gate/[flightId]/actions";
import { AdminTable, adminButtonClass, adminInputClass, adminLabelClass } from "@/components/admin/AdminTile";
import { formatMonthDay, formatTime } from "@/lib/format";
import { ASSIGNABLE_GATE_STATUS, BOARDING_FLIGHT_STATUSES, DEPARTED_FLIGHT_STATUSES } from "@/lib/gateRules";
import type { GateFlightRow, GatePassengerRow } from "@/lib/types";

// The Gate tile once a flight is found. Two steps:
// 1. both gates must be set and AVAILABLE. A pending gate is picked here; a gate whose status is
//    changed to OCCUPIED or MAINTENANCE is saved straight away, then the flight has to move to
//    another AVAILABLE gate. Once the flight has departed, gate statuses are locked.
// 2. the passenger table: Check in -> Board (both saved), and a Check in carry-on toggle
// Props (from GateTile):
// - flight          the flight, with both gates and their statuses
// - gateStatuses    every gate_status_name
// - departureGates  AVAILABLE gates at the origin airport
// - arrivalGates    AVAILABLE gates at the destination airport
// - passengers      everyone on a confirmed booking

type Gate = { gate_id: number; label: string };
type Which = "departure" | "arrival";

const outlineButtonClass =
  "h-8 rounded-control border border-gray-300 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60";

export function GateBoard({
  flight,
  gateStatuses,
  departureGates,
  arrivalGates,
  passengers,
}: {
  flight: GateFlightRow;
  gateStatuses: string[];
  departureGates: Gate[];
  arrivalGates: Gate[];
  passengers: GatePassengerRow[];
}) {
  // step 1 is done once both gates are confirmed
  const [confirmed, setConfirmed] = useState(false);
  // carry-on toggles: on screen only, nothing is saved
  const [carryOns, setCarryOns] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const departed = DEPARTED_FLIGHT_STATUSES.includes(flight.flight_status_name);
  const flightOpen = BOARDING_FLIGHT_STATUSES.includes(flight.flight_status_name);
  const usable = (gateId: number | null, status: string | null) => gateId !== null && status === ASSIGNABLE_GATE_STATUS;
  const bothGatesSet = flight.departure_gate_id !== null && flight.arrival_gate_id !== null;
  // ready for step 2: both gates set, and both AVAILABLE (a departed flight's gates can't change any more)
  const gatesReady =
    bothGatesSet &&
    (departed ||
      (usable(flight.departure_gate_id, flight.departure_gate_status) && usable(flight.arrival_gate_id, flight.arrival_gate_status)));

  function run(action: () => Promise<GateActionResult>) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setMessage(result.error);
    });
  }

  const gateProps = (which: Which) => ({
    which,
    airport: which === "departure" ? flight.origin : flight.destination,
    gate: which === "departure" ? flight.departure_gate : flight.arrival_gate,
    status: (which === "departure" ? flight.departure_gate_status : flight.arrival_gate_status) ?? "",
    choices: which === "departure" ? departureGates : arrivalGates,
    statuses: gateStatuses,
    departed,
    disabled: confirmed || pending,
    onStatus: (status: string) => run(() => setGateStatus({ flightId: flight.flight_id, which, status })),
    onAssign: (gateId: number) => run(() => assignGate({ flightId: flight.flight_id, which, gateId })),
  });

  const booked = passengers.length;
  // "Checked in" includes those who have boarded (boarding needs a check-in first)
  const checkedIn = passengers.filter((passenger) => passenger.checked_in === 1).length;
  const boarded = passengers.filter((passenger) => passenger.boarded === 1).length;

  return (
    <div className="mt-6 space-y-5">
      <p className="text-sm text-gray-700">
        <span className="font-semibold text-gray-900">{flight.flight_number}</span> · {flight.origin} → {flight.destination} ·{" "}
        {formatMonthDay(flight.departure_time, flight.origin_timezone)}, {formatTime(flight.departure_time, flight.origin_timezone)} ·{" "}
        {flight.flight_status_name}
      </p>

      {/* Step 1: both gates */}
      <div className="grid max-w-3xl grid-cols-[1fr_1fr_auto] items-start gap-3">
        <GateField label="Departure gate" {...gateProps("departure")} />
        <GateField label="Arrival gate" {...gateProps("arrival")} />
        <div className="pt-5">
          {confirmed ? (
            <button type="button" onClick={() => setConfirmed(false)} className={`${outlineButtonClass} h-9`}>
              Change gates
            </button>
          ) : (
            <button
              type="button"
              disabled={!gatesReady || pending}
              onClick={() => setConfirmed(true)}
              className={`${adminButtonClass} disabled:bg-gray-300`}
            >
              Confirm gate status
            </button>
          )}
        </div>
      </div>
      {departed && <p className="text-sm text-amber-700">This flight has already departed, so its gate statuses can&apos;t be changed.</p>}
      {!departed && !gatesReady && (
        <p className="text-sm text-amber-700">Both gates need to be assigned and available before continuing.</p>
      )}

      {message && (
        <p role="alert" className="text-sm text-red-700">
          {message}
        </p>
      )}

      {/* Step 2: the passengers */}
      {confirmed && gatesReady && (
        <>
          <div className="grid max-w-2xl grid-cols-4 gap-3">
            <Count label="Booked" value={booked} />
            <Count label="Not checked in" value={booked - checkedIn} />
            <Count label="Checked in" value={checkedIn} />
            <Count label="Boarded" value={boarded} />
          </div>
          {!flightOpen && (
            <p className="text-sm text-gray-600">
              This flight is {flight.flight_status_name.toLowerCase()}, so passengers can&apos;t be checked in or boarded.
            </p>
          )}

          <AdminTable headings={["Seat", "Passenger", "Ticket number", "Passport number", "Bags", "Status", "", ""]}>
            {passengers.map((passenger) => {
              const isBoarded = passenger.boarded === 1;
              const isCheckedIn = passenger.checked_in === 1;
              const carryOn = carryOns.includes(passenger.e_ticket_number);
              return (
                <tr key={passenger.e_ticket_number}>
                  <td className="py-2 pr-4 font-semibold">{passenger.seat_number ?? "—"}</td>
                  <td className="py-2 pr-4">
                    {passenger.last_name}, {passenger.first_name}
                  </td>
                  <td className="py-2 pr-4">{passenger.e_ticket_number}</td>
                  <td className="py-2 pr-4">{passenger.passport_number ?? "—"}</td>
                  <td className="py-2 pr-4">{passenger.bag_count}</td>
                  <td className="py-2 pr-4">{isBoarded ? "Boarded" : isCheckedIn ? "Checked in" : "Not checked in"}</td>
                  {/* one button, two steps: Check in, then Board (both saved) */}
                  <td className="py-2 pr-2">
                    <button
                      type="button"
                      disabled={isBoarded || !flightOpen || pending}
                      onClick={() =>
                        run(() =>
                          isCheckedIn
                            ? boardPassenger({ eTicket: passenger.e_ticket_number })
                            : checkInPassenger({ eTicket: passenger.e_ticket_number }),
                        )
                      }
                      className={`${adminButtonClass} h-8 w-24 px-3 text-xs disabled:bg-gray-300`}
                    >
                      {isBoarded ? "Boarded" : isCheckedIn ? "Board" : "Check in"}
                    </button>
                  </td>
                  {/* on screen only: turns blue when toggled */}
                  <td className="py-2 pr-4">
                    <button
                      type="button"
                      aria-pressed={carryOn}
                      onClick={() =>
                        setCarryOns(
                          carryOn
                            ? carryOns.filter((ticket) => ticket !== passenger.e_ticket_number)
                            : [...carryOns, passenger.e_ticket_number],
                        )
                      }
                      className={
                        carryOn
                          ? "h-8 rounded-control border border-azure-blue bg-azure-blue px-3 text-xs font-semibold text-white"
                          : outlineButtonClass
                      }
                    >
                      Check in Carry-on
                    </button>
                  </td>
                </tr>
              );
            })}
          </AdminTable>
          {booked === 0 && <p className="text-sm text-gray-600">No confirmed passengers on this flight.</p>}
        </>
      )}
    </div>
  );
}

// One gate:
// - pending (no gate yet): pick an AVAILABLE gate at that airport, saved straight away
// - AVAILABLE: its status dropdown; OCCUPIED or MAINTENANCE is saved straight away
// - OCCUPIED or MAINTENANCE: the flight has to move, so pick an AVAILABLE gate (saved straight away)
// - the flight has departed: the status is shown but locked
function GateField({
  label,
  which,
  airport,
  gate,
  status,
  statuses,
  choices,
  departed,
  disabled,
  onStatus,
  onAssign,
}: {
  label: string;
  which: Which;
  airport: string;
  gate: string | null;
  status: string;
  statuses: string[];
  choices: Gate[];
  departed: boolean;
  disabled: boolean;
  onStatus: (status: string) => void;
  onAssign: (gateId: number) => void;
}) {
  const picker = (prompt: string) =>
    choices.length === 0 ? (
      <p className="text-sm text-gray-600">No available gates at {airport}.</p>
    ) : (
      <select
        value=""
        disabled={disabled}
        onChange={(event) => onAssign(Number(event.target.value))}
        className={`${adminInputClass} border-amber-400 bg-amber-50`}
      >
        <option value="" disabled>
          {prompt}
        </option>
        {choices.map((choice) => (
          <option key={choice.gate_id} value={choice.gate_id}>
            {choice.label}
          </option>
        ))}
      </select>
    );

  if (gate === null) {
    return (
      <div>
        <p className={`${adminLabelClass} text-amber-700`}>{label}: Pending Gate Designation</p>
        {picker(`Choose a gate at ${airport}`)}
      </div>
    );
  }

  if (status !== ASSIGNABLE_GATE_STATUS && !departed) {
    return (
      <div>
        <p className={`${adminLabelClass} text-amber-700`}>
          {label}: {gate} ({status.toLowerCase()})
        </p>
        {picker(`Move to a new ${which} gate at ${airport}`)}
      </div>
    );
  }

  return (
    <label>
      <span className={adminLabelClass}>
        {label}: {gate}
      </span>
      <select value={status} disabled={disabled || departed} onChange={(event) => onStatus(event.target.value)} className={adminInputClass}>
        {statuses.map((name) => (
          <option key={name}>{name}</option>
        ))}
      </select>
    </label>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-control border border-gray-200 p-3">
      <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
