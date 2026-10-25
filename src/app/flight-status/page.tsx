import { Suspense, type ReactNode } from "react";

import { PageHeading } from "@/components/PageHeading";
import { SiteHeader } from "@/components/SiteHeader";
import { FlightStatusSearch, type StatusSearchValues } from "@/components/flight-status/FlightStatusSearch";
import { db } from "@/lib/db";
import { flightStatusDisplay } from "@/lib/flightStatusDisplay";
import type { AirportOption, FlightStatusRow } from "@/lib/types";

type SearchParams = { [key: string]: string | string[] | undefined };

const STATUS_TABLE_GRID = "grid grid-cols-[1fr_3fr_1fr] gap-x-2";

const STATUS_SELECT = `
  SELECT f.flight_id, f.flight_number, f.departure_time, f.arrival_time,
         TIMESTAMPDIFF(MINUTE, f.departure_time, f.arrival_time) AS duration_min,
         o.airport_code AS origin, d.airport_code AS destination,
         fs.flight_status_name
    FROM flight f
    JOIN airport o        ON o.airport_id = f.origin_airport_id
    JOIN airport d        ON d.airport_id = f.destination_airport_id
    JOIN flight_status fs ON fs.flight_status_id = f.flight_status_id`;

export default function FlightStatusPage({ searchParams }: PageProps<"/flight-status">) {
  return (
    <>
      <SiteHeader active="flight-status" />

      <main className="flex flex-1 flex-col">
        <section className="border-b border-gray-200 bg-white py-12">
          <div className="mx-auto max-w-6xl space-y-8 px-4">
            <PageHeading overline="Flight status" title="Which flight are you tracking?">
              Search by route, or by flight number and departure date. Times can change, so check again before you
              leave.
            </PageHeading>
            <Suspense fallback={<FlightStatusSearch airports={[]} initial={{ from: "", to: "", flightNumber: "", date: "" }} />}>
              <SearchCard searchParams={searchParams} />
            </Suspense>
          </div>
        </section>

        <section className="flex-1 bg-azure-page py-10">
          <div className="mx-auto max-w-6xl px-4">
            <Suspense fallback={<p className="text-gray-500">Looking up flights...</p>}>
              <StatusResults searchParams={searchParams} />
            </Suspense>
          </div>
        </section>
      </main>
    </>
  );
}

async function SearchCard({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const search = readStatusSearch(await searchParams);
  const [airports] = await db.query<AirportOption[]>("SELECT airport_code, city, country FROM airport ORDER BY city");

  return <FlightStatusSearch airports={airports} initial={search} />;
}

async function StatusResults({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const search = readStatusSearch(await searchParams);

  // search by flight number and date (same UTC day issue as /book/results)
  if (search.flightNumber !== "") {
    const [flights] = await db.query<FlightStatusRow[]>(
      `${STATUS_SELECT}
        WHERE f.flight_number = ? AND DATE(f.departure_time) = ?
        ORDER BY f.departure_time`,
      [search.flightNumber, search.date],
    );

    if (flights.length === 0) {
      return (
        <MessageBox>
          There is no flight {search.flightNumber} on {search.date}.
        </MessageBox>
      );
    }
    return <StatusTable flights={flights} />;
  }

  // search by route
  if (search.from !== "" && search.to !== "") {
    const [flights] = await db.query<FlightStatusRow[]>(
      `${STATUS_SELECT}
        WHERE o.airport_code = ? AND d.airport_code = ?
        ORDER BY f.departure_time`,
      [search.from, search.to],
    );

    if (flights.length === 0) {
      return (
        <MessageBox>
          There are no flights from {search.from} to {search.to}.
        </MessageBox>
      );
    }
    return <StatusTable flights={flights} />;
  }

  return <MessageBox>Search by route or by flight number to see a flight&apos;s status.</MessageBox>;
}

function readStatusSearch(params: SearchParams): StatusSearchValues {
  function text(name: string): string {
    const value = params[name];
    return (Array.isArray(value) ? value[0] : (value ?? "")).trim();
  }

  return {
    from: text("from").toUpperCase(),
    to: text("to").toUpperCase(),
    // "az 101" -> "AZ101"
    flightNumber: text("flight_number").toUpperCase().replace(/\s/g, ""),
    date: text("date"),
  };
}

function StatusTable({ flights }: { flights: FlightStatusRow[] }) {
  return (
    <div className="rounded-card border border-gray-200 bg-white px-6 pt-4 pb-2 shadow-card">
      <div className={`${STATUS_TABLE_GRID} text-center text-[11px] font-semibold tracking-widest text-gray-600 uppercase`}>
        <p className="border-b border-gray-300 pb-3">Flight</p>
        <p className="border-b border-gray-300 pb-3">Departure and Arrival</p>
        <p className="border-b border-gray-300 pb-3">Status</p>
      </div>

      <ul className="divide-y divide-gray-200">
        {flights.map((flight) => (
          <StatusRow key={flight.flight_id} flight={flight} />
        ))}
      </ul>

      <p className="py-2 text-xs text-gray-500">Times and dates are in UTC.</p>
    </div>
  );
}

function StatusRow({ flight }: { flight: FlightStatusRow }) {
  const status = flightStatusDisplay(flight.flight_status_name);

  const departureDay = flight.departure_time.slice(0, 10);
  const arrivesNextDay = flight.arrival_time.slice(0, 10) !== departureDay;

  return (
    <li className={`${STATUS_TABLE_GRID} items-center py-5`}>
      <div className="text-center">
        <p className="text-xl text-gray-900">{flight.flight_number}</p>
        <p className="text-xs text-gray-500">{departureDay}</p>
      </div>

      <div className="pr-8">
        <div className="flex justify-between text-xl text-gray-900">
          <span>{flight.departure_time.slice(11, 16)}</span>
          <span>
            {flight.arrival_time.slice(11, 16)}
            {arrivesNextDay && <sup className="ml-0.5 text-xs text-gray-500">+1</sup>}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
          <span>{flight.origin}</span>
          <span className="flex-1 border-t border-dotted border-gray-400" />
          <span className="font-normal text-gray-500">
            {Math.floor(flight.duration_min / 60)}H, {flight.duration_min % 60}M
          </span>
          <span className="flex-1 border-t border-dotted border-gray-400" />
          <span>{flight.destination}</span>
        </div>
      </div>

      <div className="text-center">
        <span className={`rounded-control px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase ${status.badgeClass}`}>{status.label}</span>
      </div>
    </li>
  );
}

function MessageBox({ children }: { children: ReactNode }) {
  return <p className="rounded-card border border-gray-200 bg-white p-6 text-gray-600 shadow-card">{children}</p>;
}
