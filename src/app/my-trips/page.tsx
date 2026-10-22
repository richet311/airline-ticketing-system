// TODO: upcoming, past and cancelled trips for signed-in customers
import { PageHeading } from "@/components/PageHeading";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TripLookupForm } from "@/components/TripLookupForm";

export default function MyTripsPage() {
  return (
    <>
      <SiteHeader active="my-trips" />

      <main className="flex-1 bg-azure-page">
        <section className="border-b border-gray-200 bg-white py-12">
          <div className="mx-auto max-w-6xl space-y-8 px-4">
            <PageHeading overline="My trips" title="Find your trip">
              No account needed. Enter your confirmation code and the last name on the booking.
            </PageHeading>
            <TripLookupForm goTo="my-trips" submitLabel="Find trip" />
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
