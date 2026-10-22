"use client";

import Form from "next/form";
import { useState } from "react";

import { FieldBox, fieldControlClass } from "@/components/FieldBox";
import { SwapIcon } from "@/components/icons";
import type { AirportOption } from "@/lib/types";

const buttonClass =
  "h-16 rounded-control bg-azure-blue px-8 text-[15px] font-semibold tracking-wide text-white hover:bg-azure-blue-dark disabled:opacity-60";

export function BookingCard({
  airports,
  initialFrom = "",
  initialTo = "",
}: {
  airports: AirportOption[];
  initialFrom?: string;
  initialTo?: string;
}) {
  return (
    <div className="border-b border-gray-200 bg-white shadow-card">
      <div className="mx-auto max-w-6xl px-4 py-6 text-gray-900">
        <BookForm airports={airports} initialFrom={initialFrom} initialTo={initialTo} />
      </div>
    </div>
  );
}

function BookForm({
  airports,
  initialFrom,
  initialTo,
}: {
  airports: AirportOption[];
  initialFrom: string;
  initialTo: string;
}) {
  const [trip, setTrip] = useState<"round" | "one-way">("round");
  const [fromAirport, setFromAirport] = useState(initialFrom);
  const [toAirport, setToAirport] = useState(initialTo);
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  // To can't be the same airport as From
  const toChoices = airports.filter((airport) => airport.airport_code !== fromAirport);

  function changeFrom(code: string) {
    setFromAirport(code);
    if (code === toAirport) {
      setToAirport("");
    }
  }

  function swapAirports() {
    setFromAirport(toAirport);
    setToAirport(fromAirport);
  }

  // YYYY-MM-DD strings sort in date order
  function changeDepart(day: string) {
    setDepartDate(day);
    if (returnDate !== "" && returnDate < day) {
      setReturnDate("");
    }
  }

  return (
    <Form action="/book/results">
      <div className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,2.4fr)_minmax(0,0.95fr)_minmax(0,1.1fr)_auto] gap-3">
        <div className="flex h-16 min-w-0 items-stretch rounded-control border border-gray-300 bg-white">
          <AirportPicker
            name="from"
            label="From"
            emptyText={{ code: "From", city: "Origin" }}
            value={fromAirport}
            airports={airports}
            onChange={changeFrom}
          />
          <button
            type="button"
            onClick={swapAirports}
            aria-label="Swap From and To"
            className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full border border-gray-300 text-azure-blue hover:border-azure-blue hover:bg-azure-sky"
          >
            <SwapIcon className="h-4 w-4" />
          </button>
          <AirportPicker
            name="to"
            label="To"
            emptyText={{ code: "To", city: "Destination" }}
            value={toAirport}
            airports={toChoices}
            onChange={setToAirport}
          />
        </div>

        <FieldBox label="Trip">
          <select
            name="trip"
            value={trip}
            onChange={(event) => setTrip(event.target.value === "one-way" ? "one-way" : "round")}
            className={fieldControlClass}
          >
            <option value="round">Round trip</option>
            <option value="one-way">One way</option>
          </select>
        </FieldBox>

        <div className="grid min-w-0 grid-cols-2">
          <FieldBox label="Depart" className="rounded-r-none">
            <input
              type="date"
              name="depart"
              value={departDate}
              onChange={(event) => changeDepart(event.target.value)}
              required
              className={fieldControlClass}
            />
          </FieldBox>
          <FieldBox label="Return" className="-ml-px rounded-l-none">
            <input
              type="date"
              name="return"
              value={returnDate}
              onChange={(event) => setReturnDate(event.target.value)}
              min={departDate === "" ? undefined : dayAfter(departDate)}
              required={trip === "round"}
              disabled={trip === "one-way"}
              className={fieldControlClass}
            />
          </FieldBox>
        </div>

        <FieldBox label="Passengers">
          <select name="passengers" defaultValue="1" className={fieldControlClass}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </FieldBox>

        <FieldBox label="Cabin">
          <select name="cabin" defaultValue="ECONOMY" className={fieldControlClass}>
            <option value="ECONOMY">Economy</option>
            <option value="PREMIUM">Premium</option>
            <option value="BUSINESS">Business</option>
            <option value="FIRST">First</option>
          </select>
        </FieldBox>

        <button type="submit" className={buttonClass}>
          Find Flights
        </button>
      </div>

      <p className="mt-3 text-xs text-gray-500">Prices include taxes and fees for 1 adult.</p>
    </Form>
  );
}

// an invisible <select> covers the box so the browser's own list and keyboard still work
function AirportPicker({
  name,
  label,
  emptyText,
  value,
  airports,
  onChange,
}: {
  name: string;
  label: string;
  emptyText: { code: string; city: string };
  value: string;
  airports: AirportOption[];
  onChange: (code: string) => void;
}) {
  const chosen = airports.find((airport) => airport.airport_code === value);

  return (
    <div className="relative min-w-0 flex-1 px-4 focus-within:bg-azure-sky/60">
      <div className="flex h-full flex-col justify-center">
        <span className={`text-2xl leading-tight font-semibold ${chosen ? "text-azure-navy" : "text-gray-400"}`}>
          {chosen ? chosen.airport_code : emptyText.code}
        </span>
        <span className="truncate text-xs text-gray-500">
          {chosen ? `${chosen.city}, ${chosen.country}` : emptyText.city}
        </span>
      </div>
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        <option value="">Choose an airport</option>
        {airports.map((airport) => (
          <option key={airport.airport_code} value={airport.airport_code}>
            {airport.city}, {airport.country} ({airport.airport_code})
          </option>
        ))}
      </select>
    </div>
  );
}

// "2026-11-30" -> "2026-12-01", in UTC so the local time zone can't shift it
function dayAfter(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate());
  return date.toISOString().slice(0, 10);
}
