import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";

import { PageHeading } from "@/components/PageHeading";
import { ArrowRightIcon } from "@/components/icons";
import { db } from "@/lib/db";
import { formatMoney, formatMonthDay } from "@/lib/format";
import type { PopularTripRow } from "@/lib/types";

const TRIP_COUNT = 4;

// only destinations with a photo are shown, so every card has an image
const destinationImages: Record<string, string> = {
  MIA: "/destinations/miami.webp",
  ORD: "/destinations/chicago.webp",
  LAX: "/destinations/los-angeles.webp",
  JFK: "/destinations/new-york.webp",
};

export async function PopularDestinations({ from }: { from: { code: string; city: string } }) {
  await connection();
  const [fares] = await db.query<PopularTripRow[]>(
    `SELECT fc.fare_class_id, f.flight_number, f.departure_time,
            d.airport_code AS destination, d.city, fc.base_price
       FROM flight f
       JOIN airport o        ON o.airport_id = f.origin_airport_id
       JOIN airport d        ON d.airport_id = f.destination_airport_id
       JOIN flight_status fs ON fs.flight_status_id = f.flight_status_id
       JOIN fare_class fc    ON fc.flight_id = f.flight_id
      WHERE o.airport_code = ?
        AND f.departure_time > NOW()
        AND fs.flight_status_name IN ('SCHEDULED', 'DELAYED')
        AND fc.seats_available > 0
      ORDER BY f.departure_time, fc.base_price`,
    [from.code],
  );

  const trips = fares
    .filter((fare) => fare.destination in destinationImages)
    .filter((fare, index, withImages) => withImages.findIndex((other) => other.destination === fare.destination) === index)
    .slice(0, TRIP_COUNT);

  return (
    <section aria-labelledby="popular-heading">
      <PageHeading as="h2" id="popular-heading" title={`Popular trips from ${from.city}`} />

      {trips.length === 0 ? (
        <p className="mt-10 text-gray-600">There are no upcoming flights from {from.city} right now.</p>
      ) : (
        <ul className="mt-10 grid grid-cols-4 gap-6">
          {trips.map((trip) => (
            <li key={trip.destination}>
              <Link
                href={`/book/seats?${new URLSearchParams({ outbound: String(trip.fare_class_id), passengers: "1" })}`}
                className="group block overflow-hidden rounded-card border border-gray-200 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:border-azure-blue hover:shadow-xl"
              >
                <div className="relative flex h-40 flex-col justify-end overflow-hidden bg-azure-navy p-5 text-white">
                  <Image
                    src={destinationImages[trip.destination]}
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
