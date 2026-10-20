import Link from "next/link";

import { PageHeading } from "@/components/PageHeading";
import { ArrowRightIcon } from "@/components/icons";
import { formatMoney } from "@/lib/format";
import type { PopularDestination } from "@/lib/types";

// full class names so Tailwind can find them
const pictureColors = [
  "from-azure-navy to-azure-blue",
  "from-azure-hero to-sky-500",
  "from-azure-blue to-azure-hero",
  "from-azure-navy via-azure-hero to-sky-600",
];

export function PopularDestinations({
  fromCity,
  days,
  destinations,
}: {
  fromCity: string;
  days: number;
  destinations: PopularDestination[];
}) {
  return (
    <section aria-labelledby="popular-heading">
      <PageHeading as="h2" id="popular-heading" overline={`Popular from ${fromCity}`} title="Where will you go next?">
        Lowest round-trip Economy fare found in the next {days} days.
      </PageHeading>

      {destinations.length === 0 ? (
        <p className="mt-10 rounded-card border border-gray-200 bg-white p-6 text-gray-600 shadow-card">
          No round-trip Economy fares from {fromCity} in the next {days} days.
        </p>
      ) : (
        <ul className="mt-10 grid grid-cols-4 gap-6">
          {destinations.map((trip, index) => (
            <li key={trip.destination}>
              <Link
                href={`/?from=${trip.origin}&to=${trip.destination}`}
                className="group block overflow-hidden rounded-card border border-gray-200 bg-white shadow-card hover:border-azure-blue"
              >
                <div
                  className={`relative flex h-40 flex-col justify-end overflow-hidden bg-linear-to-br p-5 text-white ${
                    pictureColors[index % pictureColors.length]
                  }`}
                >
                  <svg viewBox="0 0 200 160" aria-hidden="true" className="absolute inset-0 h-full w-full text-white/20">
                    <path d="M-10 140 C 50 30, 150 20, 210 70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
                  </svg>
                  <p className="relative text-5xl font-light tracking-wider">{trip.destination}</p>
                  <p className="relative text-sm text-white/80">{trip.city}</p>
                </div>
                <div className="p-5">
                  <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
                    {trip.origin} → {trip.destination}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-azure-navy">{trip.city}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Round trip from{" "}
                    <span className="text-xl font-semibold text-azure-navy">{formatMoney(trip.lowest_fare)}</span>
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
      )}
    </section>
  );
}
