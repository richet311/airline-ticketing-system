import { Suspense } from "react";
import Link from "next/link";

import { db } from "@/lib/db";
import type { AirportCity, FareOption, FlightSearchResult } from "@/lib/types";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StepPills } from "@/components/steps/StepPills";

const CABINS = ["ECONOMY", "PREMIUM", "BUSINESS", "FIRST"];

const FLIGHT_ROW_GRID = "grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3";

const FLIGHT_STATUS_DISPLAY: Record<string, { label: string; className: string }> = {
  SCHEDULED: { label: "On time", className: "text-green-700" },
  DELAYED: { label: "Delayed", className: "text-amber-600" },
  BOARDING: { label: "Boarding", className: "text-azure-blue" },
  DEPARTED: { label: "Departed", className: "text-gray-500" },
  ARRIVED: { label: "Arrived", className: "text-gray-500" },
  CANCELLED: { label: "Cancelled", className: "text-red-600" },
};

// show "N seats left" at or below this
const FEW_SEATS = 3;

const ModSearchBtn =
  "rounded border-2 border-azure-blue text-azure-blue px-6 py-2.5 text-sm font-semibold hover:bg-azure-blue-dark hover:text-white";
type SearchParams = { [key: string]: string | string[] | undefined };

// returnDate is null for one-way trips
type Search = {
  from: string;
  to: string;
  depart: string;
  returnDate: string | null;
  passengers: number;
  cabin: string;
};

export default function FlightResultsPage({ searchParams }: PageProps<"/book/results">) {
  return (
    <>
    <SiteHeader active="book" />

    <main className="flex-1 bg-azure-page">
      <Suspense fallback={<p>Searching for flights...</p>}>
        <Results searchParams={searchParams} />
      </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function Results({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const search = readSearch(await searchParams);

  const [airports] = await db.query<AirportCity[]>(
    "SELECT airport_code, city, country FROM airport WHERE airport_code IN (?, ?)",
    [search.from, search.to],
  );
  const fromAirport = airports.find((airport) => airport.airport_code === search.from);
  const toAirport = airports.find((airport) => airport.airport_code === search.to);

  if (!fromAirport || !toAirport) {
    return <p>We don&apos;t fly between {search.from} and {search.to}.</p>;
  }

  return (
    <>
      <SummaryBar fromAirport={fromAirport} toAirport={toAirport} search={search} />

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
        <StepPills current={1} />

        <FlightList
          label={`Departing flight · ${search.depart}`}
          title={`${fromAirport.city} (${fromAirport.airport_code}) to ${toAirport.city} (${toAirport.airport_code})`}
          from={search.from}
          to={search.to}
          day={search.depart}
          passengers={search.passengers}
        />

        {search.returnDate && (
          <FlightList
            label={`Return flight · ${search.returnDate}`}
            title={`${toAirport.city} (${toAirport.airport_code}) to ${fromAirport.city} (${fromAirport.airport_code})`}
            from={search.to}
            to={search.from}
            day={search.returnDate}
            passengers={search.passengers}
          />
        )}

        <p className="text-xs text-gray-500">
          Fares are per person and include taxes. Selecting a fare holds nothing yet: seats are held on the next step.
        </p>
      </div>
    </>
  );
}

function SummaryBar({
  fromAirport,
  toAirport,
  search,
}: {
  fromAirport: AirportCity;
  toAirport: AirportCity;
  search: Search;
}) {
  // "ECONOMY" -> "Economy"
  const cabinLabel = search.cabin.charAt(0) + search.cabin.slice(1).toLowerCase();

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div>
          <p className="text-lg font-bold text-azure-navy">
            {fromAirport.airport_code} {search.returnDate ? "⇄" : "→"} {toAirport.airport_code}
          </p>
          <p className="text-sm text-gray-500">
            {search.depart}
            {search.returnDate && ` – ${search.returnDate}`} · {search.passengers}{" "}
            {search.passengers === 1 ? "passenger" : "passengers"} · {cabinLabel}
          </p>
        </div>

        <Link href="/" className={ModSearchBtn}>
          Modify search
        </Link>
      </div>
    </div>
  );
}

// No validation here, the Book form on Home keeps the values sensible.
function readSearch(params: SearchParams): Search {
  function text(name: string): string {
    const value = params[name];
    return (Array.isArray(value) ? value[0] : (value ?? "")).trim();
  }

  return {
    from: text("from").toUpperCase(),
    to: text("to").toUpperCase(),
    depart: text("depart"),
    returnDate: text("trip") === "one-way" ? null : text("return"),
    passengers: Number(text("passengers")),
    cabin: text("cabin"),
  };
}

async function FlightList({
  label,
  title,
  from,
  to,
  day,
  passengers,
}: {
  label: string;
  title: string;
  from: string;
  to: string;
  day: string;
  passengers: number;
}) {
  // Known issue: DATE() is the UTC day, so late-evening flights show under the next day.
  const [flights] = await db.query<FlightSearchResult[]>(
    `SELECT f.flight_id, f.flight_number, f.departure_time, f.arrival_time,
            TIMESTAMPDIFF(MINUTE, f.departure_time, f.arrival_time) AS duration_min,
            ac.aircraft_type, fs.flight_status_name
       FROM flight f
       JOIN airport o        ON o.airport_id = f.origin_airport_id
       JOIN airport d        ON d.airport_id = f.destination_airport_id
       JOIN aircraft ac      ON ac.aircraft_id = f.aircraft_id
       JOIN flight_status fs ON fs.flight_status_id = f.flight_status_id
      WHERE o.airport_code = ?
        AND d.airport_code = ?
        AND DATE(f.departure_time) = ?
        AND f.departure_time > NOW()
        AND fs.flight_status_name IN ('SCHEDULED', 'DELAYED')
      ORDER BY f.departure_time`,
    [from, to, day],
  );

  if (flights.length === 0) {
    return (
      <section>
        <SectionHeading label={label} title={title} />
        <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">No flights on this day.</p>
      </section>
    );
  }

  const [fares] = await db.query<FareOption[]>(
    `SELECT fc.fare_class_id, fc.flight_id, cc.cabin_class_name,
            fc.base_price, fc.seats_available, fc.is_refundable
       FROM fare_class fc
       JOIN cabin_class cc ON cc.cabin_class_id = fc.cabin_class_id
      WHERE fc.flight_id IN (?)`,
    [flights.map((flight) => flight.flight_id)],
  );

  return (
    <section>
      <SectionHeading label={label} title={title} />

      <div className={`${FLIGHT_ROW_GRID} px-4 pb-2 text-[11px] font-semibold tracking-wider text-gray-500 uppercase`}>
        <span>Flight</span>
        {CABINS.map((cabin) => (
          <span key={cabin} className="text-center">
            {cabin}
          </span>
        ))}
      </div>

      <ul className="space-y-3">
        {flights.map((flight) => (
          <li key={flight.flight_id} className={`${FLIGHT_ROW_GRID} rounded-lg border border-gray-200 bg-white p-4`}>
            <FlightInfo flight={flight} />
            {CABINS.map((cabin) => (
              <FareLine
                key={cabin}
                fare={fares.find((fare) => fare.flight_id === flight.flight_id && fare.cabin_class_name === cabin)}
                passengers={passengers}
              />
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SectionHeading({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">{label}</p>
      <h2 className="text-2xl font-bold text-azure-navy">{title}</h2>
    </div>
  );
}

function FlightInfo({ flight }: { flight: FlightSearchResult }) {
  const status = FLIGHT_STATUS_DISPLAY[flight.flight_status_name] ?? {
    label: flight.flight_status_name,
    className: "text-gray-500",
  };

  return (
    <div>
      <p className="text-lg font-bold text-azure-navy">
        {flight.departure_time.slice(11, 16)} → {flight.arrival_time.slice(11, 16)}{" "}
        <span className="text-xs font-normal text-gray-500">UTC</span>
      </p>
      <p className="text-xs text-gray-500">
        {Math.floor(flight.duration_min / 60)}h {flight.duration_min % 60}m · Nonstop · {flight.flight_number} ·{" "}
        {flight.aircraft_type}
      </p>
      <p className={`text-xs font-semibold ${status.className}`}>{status.label}</p>
    </div>
  );
}

function FareLine({ fare, passengers }: { fare: FareOption | undefined; passengers: number }) {
  if (!fare || fare.seats_available < passengers) {
    return (
      <div className="flex items-center justify-center rounded-lg bg-gray-100 p-3 text-center text-sm font-semibold text-gray-400">
        No seats available
      </div>
    );
  }

  let note;
  if (fare.seats_available <= FEW_SEATS) {
    note = `${fare.seats_available} ${fare.seats_available === 1 ? "seat" : "seats"} left`;
  } else {
    note = fare.is_refundable === 1 ? "Refundable" : "Non-refundable";
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 p-3 text-center">
      <p className="text-lg font-bold text-azure-navy">${fare.base_price}</p>
      <p className="text-[11px] text-gray-500">{note}</p>
    </div>
  );
}
