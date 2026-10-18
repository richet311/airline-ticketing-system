"use client";

import Form from "next/form";
import { useState, type ReactNode } from "react";

import type { AirportOption } from "@/lib/types";

export type StatusSearchValues = {
  from: string;
  to: string;
  flightNumber: string;
  date: string;
};

const inputClass =
  "w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-azure-blue focus:ring-1 focus:ring-azure-blue focus:outline-none";

const buttonClass =
  "w-full rounded bg-azure-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-azure-blue-dark";

export function FlightStatusSearch({ airports, initial }: { airports: AirportOption[]; initial: StatusSearchValues }) {
  const [fromAirport, setFromAirport] = useState(initial.from);
  const [toAirport, setToAirport] = useState(initial.to);

  // To can't be the same airport as From
  const toChoices = airports.filter((airport) => airport.airport_code !== fromAirport);

  function changeFrom(code: string) {
    setFromAirport(code);
    if (code === toAirport) {
      setToAirport("");
    }
  }

  return (
    <div className="rounded-lg bg-white p-6 text-gray-900 shadow-xl">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-8">
        <Form action="/flight-status">
          <p className="mb-3 text-sm font-semibold text-azure-navy">BY ROUTE</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From">
              <select
                name="from"
                value={fromAirport}
                onChange={(event) => changeFrom(event.target.value)}
                required
                className={inputClass}
              >
                <option value="">Choose an airport</option>
                {airports.map((airport) => (
                  <option key={airport.airport_code} value={airport.airport_code}>
                    {airport.city}, {airport.country} ({airport.airport_code})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="To">
              <select
                name="to"
                value={toAirport}
                onChange={(event) => setToAirport(event.target.value)}
                required
                className={inputClass}
              >
                <option value="">Choose an airport</option>
                {toChoices.map((airport) => (
                  <option key={airport.airport_code} value={airport.airport_code}>
                    {airport.city}, {airport.country} ({airport.airport_code})
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <button type="submit" className={`${buttonClass} mt-4`}>
            Check status
          </button>
        </Form>

        <p className="mb-14 text-lg font-bold text-azure-navy">OR</p>

        <Form action="/flight-status">
          <p className="mb-3 text-sm font-semibold text-azure-navy">BY FLIGHT NUMBER</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Flight number">
              <input
                name="flight_number"
                defaultValue={initial.flightNumber}
                placeholder="e.g. AZ101"
                required
                autoCapitalize="characters"
                className={`${inputClass} uppercase`}
              />
            </Field>
            <Field label="Departure date">
              <input type="date" name="date" defaultValue={initial.date} required className={inputClass} />
            </Field>
          </div>
          <button type="submit" className={`${buttonClass} mt-4`}>
            Check status
          </button>
        </Form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">{label}</span>
      {children}
    </label>
  );
}
