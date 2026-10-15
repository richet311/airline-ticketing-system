import Link from "next/link";

export type Destination = {
  origin: string;
  destination: string;
  city: string;
  lowestFare: number; // round trip, USD
};

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
              <div className="flex h-32 items-center justify-center bg-slate-200 text-xs text-slate-500">
                {trip.city} photo
              </div>
              <div className="p-4">
                <p className="text-[11px] font-semibold tracking-wider text-gray-500">
                  {trip.origin} → {trip.destination}
                </p>
                <p className="font-bold text-azure-navy">{trip.city}</p>
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
