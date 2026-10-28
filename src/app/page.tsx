import { Suspense } from "react";
import { connection } from "next/server";

import { PageHeading } from "@/components/PageHeading";
import { SiteHeader } from "@/components/SiteHeader";
import { BookingCard } from "@/components/home/BookingCard";
import { PopularDestinations } from "@/components/home/PopularDestinations";
import { QuickLinks } from "@/components/home/QuickLinks";
import { RewardsBanner } from "@/components/home/RewardsBanner";
import { db } from "@/lib/db";
import type { AirportCity } from "@/lib/types";

const HOME_AIRPORT = { code: "IAH", city: "Houston" };

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
            <PageHeading as="h2" id="experience-heading" center title="Before you fly" />
            <QuickLinks />
          </div>
        </section>

        <div className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <Suspense fallback={<p className="text-gray-500">Loading trips...</p>}>
              <PopularDestinations from={HOME_AIRPORT} />
            </Suspense>
          </div>
        </div>
      </main>
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
