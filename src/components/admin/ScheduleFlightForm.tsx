"use client";

import { useActionState, useState } from "react";

import { scheduleFlight } from "@/app/employee/admin/flights/new/actions";
import { formatDuration } from "@/lib/format";
import { PLANE_ROWS, SEATS_PER_ROW } from "@/lib/planeRows";
import type { AdminFormState, AirportOption } from "@/lib/types";

import { adminButtonClass, adminInputClass, adminLabelClass, FormError } from "./AdminTile";

export type AircraftOption = { aircraft_number: string; aircraft_type: string; capacity: number };

// plane configuration
const CABINS = [
  { name: "First", field: "first" },
  { name: "Business", field: "business" },
  { name: "Premium", field: "premium" },
  { name: "Economy", field: "economy" },
];

// no rows in any cabin yet
const NO_ROWS = { first: "0", business: "0", premium: "0", economy: "0" };

const NO_TIMES = { departure_date: "", departure_time: "", arrival_date: "", arrival_time: "" };

const TIME_FIELDS = [
  { label: "Departure date (UTC)", field: "departure_date", type: "date" },
  { label: "Departure time (UTC)", field: "departure_time", type: "time" },
  { label: "Arrival date (UTC)", field: "arrival_date", type: "date" },
  { label: "Arrival time (UTC)", field: "arrival_time", type: "time" },
] as const;

function minutesBetween(times: typeof NO_TIMES): number | null {
  const departs = Date.parse(`${times.departure_date}T${times.departure_time}:00Z`);
  const arrives = Date.parse(`${times.arrival_date}T${times.arrival_time}:00Z`);
  return Number.isNaN(departs) || Number.isNaN(arrives) ? null : (arrives - departs) / 60000;
}

// tile to add a flight to the db. row counts update in real time
export function ScheduleFlightForm({ airports, aircraft }: { airports: AirportOption[]; aircraft: AircraftOption[] }) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [aircraftNumber, setAircraftNumber] = useState("");
  const [rows, setRows] = useState<Record<string, string>>(NO_ROWS);
  const [times, setTimes] = useState(NO_TIMES);

  const [state, formAction, pending] = useActionState(async (previous: AdminFormState, formData: FormData) => {
    const result = await scheduleFlight(previous, formData);
    if (result && "ok" in result) {
      setOrigin("");
      setDestination("");
      setAircraftNumber("");
      setRows(NO_ROWS);
      setTimes(NO_TIMES);
    }
    return result;
  }, null);
  const typed = state && "error" in state ? state.values : {};

  const capacity = aircraft.find((plane) => plane.aircraft_number === aircraftNumber)?.capacity;
  const planeRows = capacity === undefined ? undefined : capacity / SEATS_PER_ROW;
  const rowTotal = CABINS.reduce((sum, cabin) => sum + (Number(rows[cabin.field]) || 0), 0);
  const duration = minutesBetween(times);

  function changeOrigin(code: string) {
    setOrigin(code);
    if (code === destination) setDestination("");
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-[7rem_1fr_1fr_1.3fr_6rem] items-end gap-2">
        <label>
          <span className={adminLabelClass}>Flight</span>
          <input name="flight_number" defaultValue={typed.flight_number} placeholder="AZ500" required maxLength={10} className={`${adminInputClass} uppercase`} />
        </label>
        <label>
          <span className={adminLabelClass}>From</span>
          <select name="origin" value={origin} onChange={(event) => changeOrigin(event.target.value)} required className={adminInputClass}>
            <option value="">Choose</option>
            {airports.map((airport) => (
              <option key={airport.airport_code} value={airport.airport_code}>
                {airport.airport_code} · {airport.city}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={adminLabelClass}>To</span>
          <select name="destination" value={destination} onChange={(event) => setDestination(event.target.value)} required className={adminInputClass}>
            <option value="">Choose</option>
            {airports
              .filter((airport) => airport.airport_code !== origin)
              .map((airport) => (
                <option key={airport.airport_code} value={airport.airport_code}>
                  {airport.airport_code} · {airport.city}
                </option>
              ))}
          </select>
        </label>
        <label>
          <span className={adminLabelClass}>Aircraft</span>
          <select name="aircraft" value={aircraftNumber} onChange={(event) => setAircraftNumber(event.target.value)} required className={adminInputClass}>
            <option value="">Choose</option>
            {aircraft.map((plane) => (
              <option key={plane.aircraft_number} value={plane.aircraft_number}>
                {plane.aircraft_number} · {plane.capacity / SEATS_PER_ROW} rows
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={adminLabelClass}>Miles</span>
          <input name="distance" type="number" min={1} defaultValue={typed.distance} placeholder="925" required className={adminInputClass} />
        </label>
      </div>

      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1.2fr] items-end gap-2">
        {TIME_FIELDS.map((input) => (
          <label key={input.field}>
            <span className={adminLabelClass}>{input.label}</span>
            <input
              name={input.field}
              type={input.type}
              value={times[input.field]}
              onChange={(event) => setTimes({ ...times, [input.field]: event.target.value })}
              required
              className={adminInputClass}
            />
          </label>
        ))}
        <div>
          <span className={adminLabelClass}>Duration</span>
          <output className={`${adminInputClass} flex items-center bg-gray-50 ${duration !== null && duration <= 0 ? "text-amber-700" : ""}`}>
            {duration === null ? "Enter both times" : duration > 0 ? formatDuration(duration) : "Arrives before it departs"}
          </output>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(4,1fr)_auto] items-end gap-2">
        {CABINS.map((cabin) => (
          <div key={cabin.field} className="grid grid-cols-2 gap-1">
            <label>
              <span className={adminLabelClass}>{cabin.name} rows</span>
              <input
                name={`${cabin.field}_rows`}
                type="number"
                min={0}
                max={PLANE_ROWS}
                value={rows[cabin.field]}
                onChange={(event) => setRows({ ...rows, [cabin.field]: event.target.value })}
                className={adminInputClass}
              />
            </label>
            <label>
              <span className={adminLabelClass}>Price $</span>
              <input
                name={`${cabin.field}_price`}
                type="number"
                min={0}
                step="0.01"
                defaultValue={typed[`${cabin.field}_price`]}
                disabled={Number(rows[cabin.field]) === 0}
                className={`${adminInputClass} disabled:bg-gray-50`}
              />
            </label>
          </div>
        ))}
        <button type="submit" disabled={pending} className={adminButtonClass}>
          {pending ? "Scheduling..." : "Schedule"}
        </button>
      </div>

      <p className={`text-xs ${planeRows !== undefined && rowTotal !== planeRows ? "text-amber-700" : "text-gray-500"}`}>
        Rows assigned: {rowTotal}
        {planeRows !== undefined && ` of ${planeRows}`} ({rowTotal * SEATS_PER_ROW} seats)
      </p>
      <FormError message={state && "error" in state ? state.error : undefined} />
    </form>
  );
}
