import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { BookingCard } from "@/components/home/BookingCard";
import { PopularDestinations, type Destination } from "@/components/home/PopularDestinations";
import { QuickLinks } from "@/components/home/QuickLinks";
import { RewardsBanner } from "@/components/home/RewardsBanner";

// sample data until there's a real query
const sampleDestinations: Destination[] = [
  { origin: "IAH", destination: "JFK", city: "New York", lowestFare: 189 },
  { origin: "IAH", destination: "LAX", city: "Los Angeles", lowestFare: 149 },
  { origin: "IAH", destination: "MIA", city: "Miami", lowestFare: 99 },
  { origin: "IAH", destination: "ORD", city: "Chicago", lowestFare: 129 },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader active="book" />

      <main className="flex-1 bg-azure-page">
        <section className="bg-linear-to-b from-azure-hero to-azure-navy pt-10 pb-14 text-white">
          <div className="mx-auto max-w-6xl px-4">
            <h1 className="mb-6 text-3xl font-bold sm:text-4xl">Where can we take you?</h1>
            <BookingCard />
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
          <QuickLinks />
          <PopularDestinations fromCity="Houston" destinations={sampleDestinations} />
          <RewardsBanner />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
