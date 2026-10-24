// TODO: only signed-in customers should be able to pick a fare

import { Suspense } from "react";
import Link from "next/link";

import { db } from "@/lib/db";
import { flightStatusDisplay } from "@/lib/flightStatusDisplay";
import type { AirportCity, FareOption, FlightSearchResult } from "@/lib/types";
import { PageHeading } from "@/components/PageHeading";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StepPills } from "@/components/steps/StepPills";

const CABINS = ["ECONOMY", "PREMIUM", "BUSINESS", "FIRST"];

const FLIGHT_ROW_GRID = "grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3";

// show "N seats left" at or below this
const FEW_SEATS = 3;

const ModSearchBtn =
  "rounded-control border border-azure-blue px-6 py-2.5 text-sm font-semibold text-azure-blue hover:bg-azure-blue hover:text-white";
type SearchParams = { [key: string]: string | string[] | undefined };

// returnDate is null for one-way trips, outbound is the picked departing fare (or "")
type Search = {
  from: string;
  to: string;
  depart: string;
  returnDate: string | null;
  passengers: number;
  cabin: string;
  outbound: string;
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

        {search.returnDate !== null && search.outbound !== "" ? (
          <FlightList
            label={`Return flight · ${search.returnDate}`}
            title={`${toAirport.city} (${toAirport.airport_code}) to ${fromAirport.city} (${fromAirport.airport_code})`}
            from={search.to}
            to={search.from}
            day={search.returnDate}
            passengers={search.passengers}
            chosenCabin={search.cabin}
            hrefFor={(fareClassId) => seatsUrl(search, Number(search.outbound), fareClassId)}
          />
        ) : (
          <FlightList
            label={`Departing flight · ${search.depart}`}
            title={`${fromAirport.city} (${fromAirport.airport_code}) to ${toAirport.city} (${toAirport.airport_code})`}
            from={search.from}
            to={search.to}
            day={search.depart}
            passengers={search.passengers}
            chosenCabin={search.cabin}
            hrefFor={(fareClassId) =>
              search.returnDate !== null ? returnListUrl(search, fareClassId) : seatsUrl(search, fareClassId, null)
            }
          />
        )}

        <div className="space-y-1 text-xs text-gray-500">
          <p>Fares are per person and include taxes. Selecting a fare holds nothing yet: seats are held on the next step.</p>
          <p>
            All flights are fully refundable. Changing to a different cabin costs a change fee per passenger, set by the
            cabin you&apos;re leaving: Economy $50, Premium $100, Business $150, and First $300.
          </p>
        </div>
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
      <div className="mx-auto flex max-w-6xl items-center gap-8 px-4 py-4">
        <div className="flex items-center gap-4">
          <AirportCode airport={fromAirport} />
          <span className="text-xl text-azure-blue">{search.returnDate ? "⇄" : "→"}</span>
          <AirportCode airport={toAirport} />
        </div>

        <SummaryItem
          label={search.returnDate ? "Depart – Return" : "Depart"}
          value={search.returnDate ? `${search.depart} – ${search.returnDate}` : search.depart}
        />
        <SummaryItem label="Passengers" value={String(search.passengers)} />
        <SummaryItem label="Cabin" value={cabinLabel} />

        <Link href="/" className={`ml-auto ${ModSearchBtn}`}>
          Modify search
        </Link>
      </div>
    </div>
  );
}

function AirportCode({ airport }: { airport: AirportCity }) {
  return (
    <div>
      <p className="text-2xl leading-tight font-semibold text-azure-navy">{airport.airport_code}</p>
      <p className="text-xs text-gray-500">{airport.city}</p>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-gray-200 pl-8">
      <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase">{label}</p>
      <p className="text-[15px] font-semibold text-gray-900">{value}</p>
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
    outbound: text("outbound"),
  };
}

function returnListUrl(search: Search, outboundFareId: number): string {
  const params = new URLSearchParams({
    trip: "round",
    from: search.from,
    to: search.to,
    depart: search.depart,
    return: search.returnDate ?? "",
    passengers: String(search.passengers),
    cabin: search.cabin,
    outbound: String(outboundFareId),
  });
  return `/book/results?${params}`;
}

function seatsUrl(search: Search, outboundFareId: number, returnFareId: number | null): string {
  const params = new URLSearchParams({ outbound: String(outboundFareId), passengers: String(search.passengers) });
  if (returnFareId !== null) {
    params.set("return", String(returnFareId));
  }
  return `/book/seats?${params}`;
}

async function FlightList({
  label,
  title,
  from,
  to,
  day,
  passengers,
  chosenCabin,
  hrefFor,
}: {
  label: string;
  title: string;
  from: string;
  to: string;
  day: string;
  passengers: number;
  chosenCabin: string;
  hrefFor: (fareClassId: number) => string;
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
        <p className="rounded-card border border-gray-200 bg-white shadow-card p-4 text-sm text-gray-500">No flights on this day.</p>
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

      <div className={`${FLIGHT_ROW_GRID} px-4 pb-2 text-[11px] font-semibold tracking-widest text-gray-600 uppercase`}>
        <span>Flight</span>
        {CABINS.map((cabin) => (
          <span key={cabin} className={`text-center ${cabin === chosenCabin ? "text-azure-blue" : ""}`}>
            {cabin}
          </span>
        ))}
      </div>

      <ul className="space-y-3">
        {flights.map((flight) => (
          <li key={flight.flight_id} className={`${FLIGHT_ROW_GRID} rounded-card border border-gray-200 bg-white shadow-card p-4`}>
            <FlightInfo flight={flight} />
            {CABINS.map((cabin) => (
              <FareLine
                key={cabin}
                fare={fares.find((fare) => fare.flight_id === flight.flight_id && fare.cabin_class_name === cabin)}
                passengers={passengers}
                hrefFor={hrefFor}
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
    <div className="mb-8">
      <PageHeading overline={label} title={title} />
    </div>
  );
}

function FlightInfo({ flight }: { flight: FlightSearchResult }) {
  const status = flightStatusDisplay(flight.flight_status_name);

  return (
    <div>
      <p className="text-lg font-semibold text-azure-navy">
        {flight.departure_time.slice(11, 16)} → {flight.arrival_time.slice(11, 16)}{" "}
        <span className="text-xs font-normal text-gray-500">UTC</span>
      </p>
      <p className="text-xs text-gray-500">
        {Math.floor(flight.duration_min / 60)}h {flight.duration_min % 60}m · Nonstop · {flight.flight_number} ·{" "}
        {flight.aircraft_type}
      </p>
      <p className={`text-xs font-semibold ${status.textClass}`}>{status.label}</p>
    </div>
  );
}

function FareLine({
  fare,
  passengers,
  hrefFor,
}: {
  fare: FareOption | undefined;
  passengers: number;
  hrefFor: (fareClassId: number) => string;
}) {
  if (!fare || fare.seats_available < passengers) {
    const reason =
      !fare || fare.seats_available === 0 ? "No seats available" : "Not enough seats for all passengers";
    return (
      <div className="flex items-center justify-center rounded-card bg-gray-100 p-3 text-center text-sm font-semibold text-gray-400">
        {reason}
      </div>
    );
  }

  const fewSeatsLeft = fare.seats_available <= FEW_SEATS;

  return (
    <Link
      href={hrefFor(fare.fare_class_id)}
      className="group flex flex-col items-center justify-center rounded-card border border-gray-200 p-3 text-center hover:border-azure-blue hover:bg-azure-blue"
    >
      <p className="text-lg font-semibold text-azure-navy group-hover:text-white">${fare.base_price}</p>
      {fewSeatsLeft && (
        <p className="text-[11px] text-gray-500 group-hover:text-white">
          {fare.seats_available} {fare.seats_available === 1 ? "seat" : "seats"} left
        </p>
      )}
    </Link>
  );
}
