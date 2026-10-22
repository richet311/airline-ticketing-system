import { PageHeading } from "@/components/PageHeading";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TripLookupForm } from "@/components/TripLookupForm";

export default function CheckInPage() {
  return (
    <>
      <SiteHeader active="check-in" />

      <main className="flex-1 bg-azure-page">
        <section className="border-b border-gray-200 bg-white py-12">
          <div className="mx-auto max-w-6xl space-y-8 px-4">
            <PageHeading overline="Check in" title="Check in for your flight">
              Check-in opens 24 hours before departure. Enter your confirmation code and last name.
            </PageHeading>
            <TripLookupForm goTo="check-in" submitLabel="Check in" />
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
