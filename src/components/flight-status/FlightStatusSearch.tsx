"use client";

import Form from "next/form";
import { useState } from "react";

import { FieldBox, fieldControlClass } from "@/components/FieldBox";
import type { AirportOption } from "@/lib/types";

export type StatusSearchValues = {
  from: string;
  to: string;
  flightNumber: string;
  date: string;
};

const buttonClass =
  "h-16 rounded-control bg-azure-blue px-6 text-[15px] font-semibold tracking-wide text-white hover:bg-azure-blue-dark";

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
    <div className="rounded-card border border-gray-200 bg-white p-6 text-gray-900 shadow-card">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-8">
        <Form action="/flight-status">
          <p className="mb-4 text-[13px] font-semibold tracking-widest text-azure-navy">BY ROUTE</p>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3">
            <FieldBox label="From">
              <select
                name="from"
                value={fromAirport}
                onChange={(event) => changeFrom(event.target.value)}
                required
                className={fieldControlClass}
              >
                <option value="">Choose an airport</option>
                {airports.map((airport) => (
                  <option key={airport.airport_code} value={airport.airport_code}>
                    {airport.city}, {airport.country} ({airport.airport_code})
                  </option>
                ))}
              </select>
            </FieldBox>
            <FieldBox label="To">
              <select
                name="to"
                value={toAirport}
                onChange={(event) => setToAirport(event.target.value)}
                required
                className={fieldControlClass}
              >
                <option value="">Choose an airport</option>
                {toChoices.map((airport) => (
                  <option key={airport.airport_code} value={airport.airport_code}>
                    {airport.city}, {airport.country} ({airport.airport_code})
                  </option>
                ))}
              </select>
            </FieldBox>
            <button type="submit" className={buttonClass}>
              Check status
            </button>
          </div>
        </Form>

        <p className="mb-5 text-sm font-semibold tracking-widest text-gray-400">OR</p>

        <Form action="/flight-status">
          <p className="mb-4 text-[13px] font-semibold tracking-widest text-azure-navy">BY FLIGHT NUMBER</p>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3">
            <FieldBox label="Flight number">
              <input
                name="flight_number"
                defaultValue={initial.flightNumber}
                placeholder="e.g. AZ101"
                required
                autoCapitalize="characters"
                className={`${fieldControlClass} uppercase placeholder:normal-case`}
              />
            </FieldBox>
            <FieldBox label="Departure date">
              <input type="date" name="date" defaultValue={initial.date} required className={fieldControlClass} />
            </FieldBox>
            <button type="submit" className={buttonClass}>
              Check status
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
