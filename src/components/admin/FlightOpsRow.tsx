"use client";

import { useState, useTransition } from "react";

import { updateFlightGate, updateFlightStatus, type FlightUpdateResult } from "@/app/employee/admin/flights/[flightId]/actions";
import { formatDate, formatTime } from "@/lib/format";
import { ASSIGNABLE_GATE_STATUS, gateRequired, missingGateMessage } from "@/lib/gateRules";
import type { OpsFlightRow } from "@/lib/types";

import { adminInputClass } from "./AdminTile";

//This is for gate dropdowns
export type GateChoice = { gate_id: number; label: string; status: string };

export function FlightOpsRow({
  flight,
  departureGates,
  arrivalGates,
  statuses,
}: {
  flight: OpsFlightRow;
  departureGates: GateChoice[];
  arrivalGates: GateChoice[];
  statuses: string[];
}) {
  const [departureGate, setDepartureGate] = useState(String(flight.departure_gate_id ?? ""));
  const [arrivalGate, setArrivalGate] = useState(String(flight.arrival_gate_id ?? ""));
  const [status, setStatus] = useState(flight.flight_status_name);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  //Try the update on the dropdown and prevent it if it fails
  function save(apply: () => void, undo: () => void, run: () => Promise<FlightUpdateResult>) {
    apply();
    setMessage(null);
    startTransition(async () => {
      const result = await run();
      if (!result.ok) {
        undo();
        setMessage(result.error);
      }
    });
  }

  function changeGate(which: "departure" | "arrival", value: string) {
    const [current, set] = which === "departure" ? [departureGate, setDepartureGate] : [arrivalGate, setArrivalGate];
    save(
      () => set(value),
      () => set(current),
      () => updateFlightGate({ flightId: flight.flight_id, which, gateId: value === "" ? null : Number(value) }),
    );
  }

  function changeStatus(value: string) {
    const current = status;
    save(
      () => setStatus(value),
      () => setStatus(current),
      () => updateFlightStatus({ flightId: flight.flight_id, status: value }),
    );
  }

  return (
    <tr className="align-top">
      <td className="py-2 pr-4 font-semibold">{flight.flight_number}</td>
      <td className="py-2 pr-4">
        {flight.origin} → {flight.destination}
      </td>
      <td className="py-2 pr-4">
        {formatDate(flight.departure_time)}, {formatTime(flight.departure_time)}
      </td>
      <td className="py-2 pr-4">{flight.aircraft_number}</td>
      <td className="py-2 pr-4">
        <GateSelect
          value={departureGate}
          gates={departureGates}
          ownGateId={flight.departure_gate_id}
          required={gateRequired("departure", status)}
          disabled={pending}
          onChange={(value) => changeGate("departure", value)}
        />
      </td>
      <td className="py-2 pr-4">
        <GateSelect
          value={arrivalGate}
          gates={arrivalGates}
          ownGateId={flight.arrival_gate_id}
          required={gateRequired("arrival", status)}
          disabled={pending}
          onChange={(value) => changeGate("arrival", value)}
        />
      </td>
      <td className="py-2 pr-4">
        <select value={status} disabled={pending} onChange={(event) => changeStatus(event.target.value)} className={adminInputClass}>
          {statuses.map((name) => (
            <option key={name} disabled={missingGateMessage(name, departureGate !== "", arrivalGate !== "") !== null}>
              {name}
            </option>
          ))}
        </select>
        {message && (
          <p role="alert" className="mt-1 text-xs text-red-700">
            {message}
          </p>
        )}
      </td>
    </tr>
  );
}

//Pending Gate Designation means there is a null for the gate currently. Validation occurs to ensure that this is never the case
// when a flight absolutely needs a gate
function GateSelect({
  value,
  gates,
  ownGateId,
  required,
  disabled,
  onChange,
}: {
  value: string;
  gates: GateChoice[];
  ownGateId: number | null;
  required: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={adminInputClass}>
      <option value="" disabled={required}>
        Pending Gate Designation
      </option>
      {gates.map((gate) => {
        const usable = gate.status === ASSIGNABLE_GATE_STATUS || gate.gate_id === ownGateId;
        return (
          <option key={gate.gate_id} value={gate.gate_id} disabled={!usable}>
            {gate.label}
            {gate.status !== ASSIGNABLE_GATE_STATUS && ` (${gate.status.toLowerCase()})`}
          </option>
        );
      })}
    </select>
  );
}
