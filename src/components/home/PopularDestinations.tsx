import Link from "next/link";

import { PageHeading } from "@/components/PageHeading";
import { ArrowRightIcon } from "@/components/icons";
import { formatMoney } from "@/lib/format";

const destinations = [
  { code: "MIA", city: "Miami", fare: 243 },
  { code: "ORD", city: "Chicago", fare: 308 },
  { code: "LAX", city: "Los Angeles", fare: 408 },
  { code: "JFK", city: "New York", fare: 507 },
];

// full class names so Tailwind can find them
const pictureColors = [
  "from-azure-navy to-azure-blue",
  "from-azure-hero to-sky-500",
  "from-azure-blue to-azure-hero",
  "from-azure-navy via-azure-hero to-sky-600",
];

export function PopularDestinations({ from }: { from: { code: string; city: string } }) {
  return (
    <section aria-labelledby="popular-heading">
      <PageHeading as="h2" id="popular-heading" title={`Popular trips from ${from.city}`} />

      <ul className="mt-10 grid grid-cols-4 gap-6">
        {destinations.map((trip, index) => (
          <li key={trip.code}>
            <Link
              href={`/?from=${from.code}&to=${trip.code}`}
              className="group block overflow-hidden rounded-card border border-gray-200 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:border-azure-blue hover:shadow-xl"
            >
              <div
                className={`relative flex h-40 flex-col justify-end overflow-hidden bg-linear-to-br p-5 text-white transition duration-500 group-hover:scale-105 ${
                  pictureColors[index % pictureColors.length]
                }`}
              >
                <svg viewBox="0 0 200 160" aria-hidden="true" className="absolute inset-0 h-full w-full text-white/20">
                  <path d="M-10 140 C 50 30, 150 20, 210 70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
                </svg>
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
