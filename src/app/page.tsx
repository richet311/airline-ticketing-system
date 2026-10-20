import { Suspense } from "react";
import { connection } from "next/server";

import { SiteFooter } from "@/components/SiteFooter";
import { PageHeading } from "@/components/PageHeading";
import { SiteHeader } from "@/components/SiteHeader";
import { BookingCard } from "@/components/home/BookingCard";
import { PopularDestinations } from "@/components/home/PopularDestinations";
import { QuickLinks } from "@/components/home/QuickLinks";
import { RewardsBanner } from "@/components/home/RewardsBanner";
import { db } from "@/lib/db";
import type { AirportCity, PopularDestination } from "@/lib/types";

const HOME_AIRPORT = { code: "IAH", city: "Houston" };

const FARE_WINDOW_DAYS = 30;

const MAX_DESTINATION_CARDS = 4;

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <>
      <SiteHeader active="book" />

      <main className="flex-1 bg-white">
        <section aria-labelledby="home-heading">
          <div className="bg-azure-navy text-white">
            <div className="mx-auto max-w-6xl px-4 pt-8 pb-6">
              <h1 id="home-heading" className="text-[2.5rem] leading-tight font-light">
                Where can we take you?
              </h1>
            </div>
          </div>
          <Suspense fallback={<BookingCard airports={[]} />}>
            <BookingCardWithAirports searchParams={searchParams} />
          </Suspense>
        </section>

        <RewardsBanner />

        <section aria-labelledby="experience-heading" className="py-16">
          <div className="mx-auto max-w-6xl space-y-10 px-4">
            <PageHeading as="h2" id="experience-heading" center overline="The Azure Air experience" title="Everything for your trip, from booking to boarding" />
            <QuickLinks />
          </div>
        </section>

        <div className="border-t border-gray-200 bg-azure-page py-16">
          <div className="mx-auto max-w-6xl px-4">
            <Suspense fallback={null}>
              <PopularDestinationsWithFares />
            </Suspense>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

async function BookingCardWithAirports({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const params = await searchParams;
  // only query at request time (mysql2 calls Date.now(), which breaks prerendering)
  await connection();
  const [airports] = await db.query<AirportCity[]>("SELECT airport_code, city, country FROM airport ORDER BY city");

  function airportInUrl(name: string): string | undefined {
    const value = params[name];
    const code = (Array.isArray(value) ? value[0] : value)?.trim().toUpperCase();
    return airports.find((airport) => airport.airport_code === code)?.airport_code;
  }

  const from = airportInUrl("from") ?? HOME_AIRPORT.code;
  const urlTo = airportInUrl("to");
  const to = urlTo !== undefined && urlTo !== from ? urlTo : "";

  // key resets the card when the route changes
  return <BookingCard key={`${from}-${to}`} airports={airports} initialFrom={from} initialTo={to} />;
}

// Lowest round-trip Economy fare per destination: a flight there in the next FARE_WINDOW_DAYS days plus a flight back after it lands.
async function PopularDestinationsWithFares() {
  await connection();
  const [destinations] = await db.query<PopularDestination[]>(
    `SELECT origin.airport_code AS origin, dest.airport_code AS destination, dest.city AS city,
            MIN(outbound_fare.base_price + inbound_fare.base_price) AS lowest_fare
       FROM flight outbound
       JOIN airport origin             ON origin.airport_id = outbound.origin_airport_id
       JOIN airport dest               ON dest.airport_id = outbound.destination_airport_id
       JOIN flight_status outbound_fs  ON outbound_fs.flight_status_id = outbound.flight_status_id
       JOIN fare_class outbound_fare   ON outbound_fare.flight_id = outbound.flight_id
       JOIN cabin_class outbound_cabin ON outbound_cabin.cabin_class_id = outbound_fare.cabin_class_id
       JOIN flight inbound             ON inbound.origin_airport_id = outbound.destination_airport_id
                                      AND inbound.destination_airport_id = outbound.origin_airport_id
                                      AND inbound.departure_time > outbound.arrival_time
       JOIN flight_status inbound_fs   ON inbound_fs.flight_status_id = inbound.flight_status_id
       JOIN fare_class inbound_fare    ON inbound_fare.flight_id = inbound.flight_id
       JOIN cabin_class inbound_cabin  ON inbound_cabin.cabin_class_id = inbound_fare.cabin_class_id
      WHERE origin.airport_code = ?
        AND outbound.departure_time > NOW()
        AND outbound.departure_time < NOW() + INTERVAL ? DAY
        AND outbound_fs.flight_status_name IN ('SCHEDULED', 'DELAYED')
        AND inbound_fs.flight_status_name IN ('SCHEDULED', 'DELAYED')
        AND outbound_cabin.cabin_class_name = 'ECONOMY'
        AND inbound_cabin.cabin_class_name = 'ECONOMY'
        AND outbound_fare.seats_available > 0
        AND inbound_fare.seats_available > 0
      GROUP BY origin.airport_code, dest.airport_code, dest.city
      ORDER BY lowest_fare, dest.city
      LIMIT ?`,
    [HOME_AIRPORT.code, FARE_WINDOW_DAYS, MAX_DESTINATION_CARDS],
  );

  return <PopularDestinations fromCity={HOME_AIRPORT.city} days={FARE_WINDOW_DAYS} destinations={destinations} />;
}
