import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";

import { PageHeading } from "@/components/PageHeading";
import { ArrowRightIcon } from "@/components/icons";
import { db } from "@/lib/db";
import { formatMoney, formatMonthDay } from "@/lib/format";
import type { AirportCity, PopularTripRow } from "@/lib/types";

const TRIP_COUNT = 4;

// only destinations with a photo are shown, so every card has an image
const destinationImages: Record<number, string> = {
  10010: "/destinations/miami.webp",
  10007: "/destinations/chicago.webp",
  10006: "/destinations/los-angeles.webp",
  10004: "/destinations/new-york.webp",
};

export async function PopularDestinations({ airportId }: { airportId: number }) {
  await connection();
  const [homes] = await db.query<AirportCity[]>("SELECT airport_code, city, country FROM airport WHERE airport_id = ?", [
    airportId,
  ]);
  if (homes.length === 0) return null;
  const from = { code: homes[0].airport_code, city: homes[0].city };

  const [fares] = await db.query<PopularTripRow[]>(
    `SELECT fc.fare_class_id, f.flight_number, f.departure_time,
            d.airport_id AS destination_id, d.airport_code AS destination, d.city, fc.base_price
       FROM flight f
       JOIN airport d        ON d.airport_id = f.destination_airport_id
       JOIN flight_status fs ON fs.flight_status_id = f.flight_status_id
       JOIN fare_class fc    ON fc.flight_id = f.flight_id
      WHERE f.origin_airport_id = ?
        AND f.departure_time > NOW()
        AND fs.flight_status_name IN ('SCHEDULED', 'DELAYED')
        AND fc.seats_available > 0
      ORDER BY f.departure_time, fc.base_price`,
    [airportId],
  );

  const trips = fares
    .filter((fare) => fare.destination_id in destinationImages)
    .filter((fare, index, withImages) => withImages.findIndex((other) => other.destination_id === fare.destination_id) === index)
    .slice(0, TRIP_COUNT);

  return (
    <section aria-labelledby="popular-heading">
      <PageHeading as="h2" id="popular-heading" title={`Popular trips from ${from.city}`} />

      {trips.length === 0 ? (
        <p className="mt-10 text-gray-600">There are no upcoming flights from {from.city} right now.</p>
      ) : (
        <ul className="mt-10 grid grid-cols-4 gap-6">
          {trips.map((trip) => (
            <li key={trip.destination_id}>
              <Link
                href={`/book/seats?${new URLSearchParams({ outbound: String(trip.fare_class_id), passengers: "1" })}`}
                className="group block overflow-hidden rounded-card border border-gray-200 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:border-azure-blue hover:shadow-xl"
              >
                <div className="relative flex h-40 flex-col justify-end overflow-hidden bg-azure-navy p-5 text-white">
                  <Image
                    src={destinationImages[trip.destination_id]}
                    alt=""
                    fill
                    sizes="(min-width: 1152px) 270px, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-azure-navy/85 via-azure-navy/30 to-transparent" />
                  <p className="relative text-5xl font-light tracking-wider">{trip.destination}</p>
                  <p className="relative text-sm text-white/80">{trip.city}</p>
                </div>
                <div className="p-5">
                  <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
                    {from.code} → {trip.destination} · {trip.flight_number} · {formatMonthDay(trip.departure_time)}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-azure-navy">{trip.city}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    One way from{" "}
                    <span className="text-xl font-semibold text-azure-navy">{formatMoney(trip.base_price)}</span>
                  </p>
                  <span className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-azure-blue group-hover:underline">
                    Choose seats
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
