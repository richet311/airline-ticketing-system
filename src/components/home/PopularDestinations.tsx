import Link from "next/link";

// "Popular from Houston" on Home: one card per destination, each linking to a search.
// The page passes the destinations in. Later they can come from a query that finds the
// lowest round-trip Economy fare per route in the next 30 days.

// Destination (a TypeScript type): the shape of the data for one card. TypeScript uses it while
// you write code, to flag a missing or misspelled field, and removes it when the site is built.
// It is exported so page.tsx can label its list with the same shape (Destination[]).
//
// Database: where each field will come from. Name the query's columns the same way, for
// example SELECT dest.airport_code AS destination, dest.city AS city, ...
// - origin       airport.airport_code of the flight's origin_airport_id
// - destination  airport.airport_code of the flight's destination_airport_id
// - city         airport.city of that destination airport
// - lowestFare   cheapest ECONOMY fare_class.base_price there plus cheapest back (round trip)
export type Destination = {
  origin: string; // e.g. "IAH"
  destination: string; // e.g. "JFK"
  city: string; // e.g. "New York"
  lowestFare: number; // round trip in USD, e.g. 189 (db.ts returns DECIMAL as a number)
};

// Props: the values the page passes in, written like HTML attributes:
//   <PopularDestinations fromCity="Houston" destinations={...} />
// - fromCity      the city in the heading, "Popular from Houston". Typed in for now.
// - destinations  one Destination per card, in the order they are shown.
export function PopularDestinations({ fromCity, destinations }: { fromCity: string; destinations: Destination[] }) {
  return (
    <section aria-labelledby="popular-heading">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="popular-heading" className="text-xl font-bold text-azure-navy">
          Popular from {fromCity}
        </h2>
        <p className="text-xs text-gray-500">Lowest round-trip Economy fare found in the next 30 days</p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {destinations.map((trip) => (
          <li key={trip.destination}>
            <Link
              href={`/book/results?trip=round&from=${trip.origin}&to=${trip.destination}`}
              className="block overflow-hidden rounded-lg border border-gray-200 bg-white hover:border-azure-blue"
            >
              {/* Photo placeholder. Add photos to public/images/ and show them with next/image. */}
              <div className="flex h-32 items-center justify-center bg-slate-200 text-xs text-slate-500">
                {trip.city} photo
              </div>
              <div className="p-4">
                <p className="text-[11px] font-semibold tracking-wider text-gray-500">
                  {trip.origin} → {trip.destination}
                </p>
                <p className="font-bold text-azure-navy">{trip.city}</p>
                {/* Switch to formatMoney() from src/lib/format.ts once it is written. */}
                <p className="text-sm text-gray-500">
                  Round trip from <span className="text-base font-bold text-azure-navy">${trip.lowestFare}</span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
