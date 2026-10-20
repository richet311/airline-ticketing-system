// TODO: only signed-in customers should reach this page

import { Suspense } from "react";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SeatSelector } from "@/components/seats/SeatSelector";
import { StepPills } from "@/components/steps/StepPills";
import { db } from "@/lib/db";
import type { FareOption, FlightStatusRow, SeatMapRow } from "@/lib/types";

type SearchParams = { [key: string]: string | string[] | undefined };

export default function SeatsPage({ searchParams }: PageProps<"/book/seats">) {
  return (
    <>
      <SiteHeader active="book" />

      <main className="flex-1 bg-azure-page">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
          <StepPills current={2} />
          <Suspense fallback={<p className="text-gray-500">Loading seats...</p>}>
            <SeatSelection searchParams={searchParams} />
          </Suspense>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

async function SeatSelection({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  function text(name: string): string {
    const value = params[name];
    return (Array.isArray(value) ? value[0] : (value ?? "")).trim();
  }

  const outbound = Number(text("outbound"));
  const returnFare = text("return") === "" ? null : Number(text("return"));
  const passengers = Number(text("passengers")) || 1;
  const leg = text("leg") === "return" && returnFare !== null ? "return" : "outbound";
  // "3A,4A" -> ["3A", "4A"]; "" -> []
  const outboundSeats = text("outbound_seats") === "" ? [] : text("outbound_seats").split(",");

  const fareIds = returnFare === null ? [outbound] : [outbound, returnFare];
  const [fares] = await db.query<FareOption[]>(
    `SELECT fc.fare_class_id, fc.flight_id, cc.cabin_class_name,
            fc.base_price, fc.seats_available, fc.is_refundable
       FROM fare_class fc
       JOIN cabin_class cc ON cc.cabin_class_id = fc.cabin_class_id
      WHERE fc.fare_class_id IN (?)`,
    [fareIds],
  );
  const outboundFare = fares.find((fare) => fare.fare_class_id === outbound);
  const returnFareRow = fares.find((fare) => fare.fare_class_id === returnFare);
  const currentFare = leg === "return" ? returnFareRow : outboundFare;

  if (!outboundFare || !currentFare || (returnFare !== null && !returnFareRow)) {
    return (
      <p className="rounded-card border border-gray-200 bg-white shadow-card p-6 text-gray-600">
        We couldn&apos;t find that fare. Please start a new search from the home page.
      </p>
    );
  }

  const [flights] = await db.query<FlightStatusRow[]>(
    `SELECT f.flight_id, f.flight_number, f.departure_time, f.arrival_time,
            TIMESTAMPDIFF(MINUTE, f.departure_time, f.arrival_time) AS duration_min,
            o.airport_code AS origin, d.airport_code AS destination,
            fs.flight_status_name
       FROM flight f
       JOIN airport o        ON o.airport_id = f.origin_airport_id
       JOIN airport d        ON d.airport_id = f.destination_airport_id
       JOIN flight_status fs ON fs.flight_status_id = f.flight_status_id
      WHERE f.flight_id IN (?)
      ORDER BY f.departure_time`,
    [fares.map((fare) => fare.flight_id)],
  );

  // an expired hold counts as AVAILABLE
  const [seats] = await db.query<SeatMapRow[]>(
    `SELECT s.seat_number, cc.cabin_class_name,
            CASE WHEN ss.seat_status_name = 'HELD' AND s.held_until <= NOW() THEN 'AVAILABLE'
                 ELSE ss.seat_status_name END AS seat_status_name
       FROM seat s
       JOIN cabin_class cc ON cc.cabin_class_id = s.cabin_class_id
       JOIN seat_status ss ON ss.seat_status_id = s.seat_status_id
      WHERE s.flight_id = ?`,
    [currentFare.flight_id],
  );

  const farePerPerson = outboundFare.base_price + (returnFareRow?.base_price ?? 0);

  // key resets the selector for the return flight
  return (
    <SeatSelector
      key={currentFare.fare_class_id}
      seats={seats}
      cabin={currentFare.cabin_class_name}
      passengers={passengers}
      tripFlights={flights.map((flight) => ({
        label: flight.flight_id === outboundFare.flight_id ? "Depart" : "Return",
        flight,
      }))}
      currentFlightId={currentFare.flight_id}
      currentFareId={currentFare.fare_class_id}
      fareTotal={farePerPerson * passengers}
      flightCount={fares.length}
      leg={leg}
      outbound={outbound}
      returnFare={returnFare}
      outboundSeats={outboundSeats}
    />
  );
}
