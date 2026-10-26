import { randomUUID } from "node:crypto";
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { SiteHeader } from "@/components/SiteHeader";
import { StepPills } from "@/components/steps/StepPills";
import { db } from "@/lib/db";
import { loginUrl } from "@/lib/loginRedirect";
import { getQualifyingSpend, getTiers, tierFor, tierLabel } from "@/lib/rewards";
import { getCurrentUser } from "@/lib/session";
import type { FareOption, FlightStatusRow, UpgradeType } from "@/lib/types";

type SearchParams = { [key: string]: string | string[] | undefined };

export default function CheckoutPage({ searchParams }: PageProps<"/book/checkout">) {
  return (
    <>
      <SiteHeader active="book" />

      <main className="flex-1 bg-azure-page">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
          <StepPills current={3} />
          <Suspense fallback={<p className="text-gray-500">Loading checkout...</p>}>
            <Checkout searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function Checkout({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  if (!(await getCurrentUser())) redirect(loginUrl("/book/checkout", params));
  function text(name: string): string {
    const value = params[name];
    return (Array.isArray(value) ? value[0] : (value ?? "")).trim();
  }

  const outbound = Number(text("outbound"));
  const returnFare = text("return") === "" ? null : Number(text("return"));
  const passengers = Number(text("passengers")) || 1;
  // "3A,4A" -> ["3A", "4A"]; "" -> []
  const outboundSeats = text("outbound_seats") === "" ? [] : text("outbound_seats").split(",");
  const returnSeats = text("return_seats") === "" ? [] : text("return_seats").split(",");

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

  if (!outboundFare || (returnFare !== null && !returnFareRow)) {
    return <Notice>We couldn&apos;t find that fare. Please start a new search from the home page.</Notice>;
  }

  // missing seats, send them back to seat selection
  if (outboundSeats.length !== passengers || (returnFare !== null && returnSeats.length !== passengers)) {
    const seatsParams = new URLSearchParams({ outbound: String(outbound), passengers: String(passengers) });
    if (returnFare !== null) seatsParams.set("return", String(returnFare));
    return (
      <Notice>
        Every traveler needs a seat first.{" "}
        <Link href={`/book/seats?${seatsParams}`} className="font-semibold text-azure-blue hover:underline">
          Choose seats
        </Link>
      </Notice>
    );
  }

  // already purchased (back button or reload)
  const legs = [{ fare: outboundFare, seats: outboundSeats }];
  if (returnFareRow) legs.push({ fare: returnFareRow, seats: returnSeats });
  for (const leg of legs) {
    const [tickets] = await db.query<RowDataPacket[]>(
      "SELECT booking_id FROM ticket WHERE flight_id = ? AND seat_number IN (?) LIMIT 1",
      [leg.fare.flight_id, leg.seats],
    );
    if (tickets.length > 0) {
      return (
        <Notice>
          These seats have already been purchased.{" "}
          <Link href="/my-trips" className="font-semibold text-azure-blue hover:underline">
            Find your trip in My Trips
          </Link>
        </Notice>
      );
    }
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
      WHERE f.flight_id IN (?)`,
    [legs.map((leg) => leg.fare.flight_id)],
  );

  const [upgrades] = await db.query<UpgradeType[]>(
    `SELECT upgrade_id, upgrade_name, upgrade_description, upgrade_price
       FROM upgrade_type
      ORDER BY upgrade_price, upgrade_name`,
  );

  const tripLegs = legs.flatMap((leg, i) => {
    const flight = flights.find((row) => row.flight_id === leg.fare.flight_id);
    return flight ? [{ label: i === 0 ? "Depart" : "Return", flight, fare: leg.fare, seats: leg.seats }] : [];
  });

  // Azure Rewards box in the price summary (null for guests)
  const user = await getCurrentUser();
  let rewards = null;
  if (user) {
    const tier = tierFor(await getQualifyingSpend(user.user_id), await getTiers());
    rewards = { points: user.loyalty_points, tierName: tierLabel(tier.tier_name), bonusPercent: tier.bonus_percent };
  }

  return (
    <CheckoutForm
      rewards={rewards}
      passengers={passengers}
      legs={tripLegs}
      upgrades={upgrades}
      outbound={outbound}
      returnFare={returnFare}
      outboundSeats={outboundSeats}
      returnSeats={returnSeats}
      // new key per page load so a double submit can't pay twice
      idempotencyKey={randomUUID()}
    />
  );
}

function Notice({ children }: { children: ReactNode }) {
  return <p className="rounded-card border border-gray-200 bg-white shadow-card p-6 text-gray-600">{children}</p>;
}
