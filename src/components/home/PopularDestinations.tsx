import Image from "next/image";
import Link from "next/link";

import { PageHeading } from "@/components/PageHeading";
import { ArrowRightIcon } from "@/components/icons";
import { formatMoney } from "@/lib/format";

const destinations = [
  { code: "MIA", city: "Miami", fare: 243, image: "/destinations/miami.webp" },
  { code: "ORD", city: "Chicago", fare: 308, image: "/destinations/chicago.webp" },
  { code: "LAX", city: "Los Angeles", fare: 408, image: "/destinations/los-angeles.webp" },
  { code: "JFK", city: "New York", fare: 507, image: "/destinations/new-york.webp" },
];

export function PopularDestinations({ from }: { from: { code: string; city: string } }) {
  return (
    <section aria-labelledby="popular-heading">
      <PageHeading as="h2" id="popular-heading" title={`Popular trips from ${from.city}`} />

      <ul className="mt-10 grid grid-cols-4 gap-6">
        {destinations.map((trip) => (
          <li key={trip.code}>
            <Link
              href={`/?from=${from.code}&to=${trip.code}`}
              className="group block overflow-hidden rounded-card border border-gray-200 bg-white shadow-card hover:border-azure-blue"
            >
              <div className="relative flex h-40 flex-col justify-end overflow-hidden bg-azure-navy p-5 text-white">
                <Image
                  src={trip.image}
                  alt=""
                  fill
                  sizes="(min-width: 1152px) 270px, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-azure-navy/85 via-azure-navy/30 to-transparent" />
                <p className="relative text-5xl font-light tracking-wider">{trip.code}</p>
                <p className="relative text-sm text-white/80">{trip.city}</p>
              </div>
              <div className="p-5">
                <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
                  {from.code} → {trip.code}
                </p>
                <p className="mt-1 text-lg font-semibold text-azure-navy">{trip.city}</p>
                <p className="mt-1 text-sm text-gray-600">
                  Round trip from{" "}
                  <span className="text-xl font-semibold text-azure-navy">{formatMoney(trip.fare)}</span>
                </p>
                <span className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-azure-blue group-hover:underline">
                  Search flights
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
