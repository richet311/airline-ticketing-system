import { Suspense } from "react";
import Link from "next/link";

import { PageHeading } from "@/components/PageHeading";
import { SiteHeader } from "@/components/SiteHeader";
import { TripActionForm } from "@/components/trips/TripActionForm";
import { Card, LegSummary, TripNotFound, travelerName } from "@/components/trips/TripParts";
import { cancellationRefund, cancelProblem } from "@/lib/bookingRules";
import { formatMoney } from "@/lib/format";
import { getTrip, legLabel } from "@/lib/trips";

import { cancelTrip } from "./actions";

export default function CancelTripPage({ params }: PageProps<"/my-trips/[bookingId]/cancel">) {
  return (
    <>
      <SiteHeader active="my-trips" />

      <main className="flex-1 bg-azure-page">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
          <Suspense fallback={<p className="text-gray-500">Loading your trip...</p>}>
            <CancelTrip params={params} />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function CancelTrip({ params }: { params: Promise<{ bookingId: string }> }) {
  const bookingId = (await params).bookingId.toUpperCase();
  const trip = await getTrip(bookingId);
  if (!trip) return <TripNotFound bookingId={bookingId} backHref="/my-trips" />;

  const { booking, legs } = trip;
  const problem = cancelProblem(booking.booking_status_name, legs.map((leg) => leg.tickets));
  const refund = cancellationRefund(booking.paid_amount);
  const travelers = [...new Map(legs.flatMap((leg) => leg.tickets).map((t) => [t.passenger_id, t])).values()];

  return (
    <>
      <Link href={`/my-trips/${bookingId}`} className="text-sm font-semibold text-azure-blue hover:underline">
        ← Back to trip {bookingId}
      </Link>

      <PageHeading overline="Cancel trip" title="Cancel this trip?">
        Every flight on confirmation {bookingId} is cancelled for all travelers, and your seats are released.
      </PageHeading>

      {legs.map((leg, i) => (
        <Card key={leg.flight.flight_id}>
          <LegSummary label={legLabel(legs, i)} flight={leg.flight} />
        </Card>
      ))}

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-azure-navy">What happens next</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>
            Travelers: {travelers.map(travelerName).join(", ")}.
          </li>
          <li>
            All Azure Air fares are fully refundable. We refund{" "}
            <span className="font-semibold text-gray-900">{formatMoney(refund, booking.currency)}</span> to your original
            payment method.
          </li>
          <li>Azure Rewards points earned on this booking are removed from your balance.</li>
          <li>This can&apos;t be undone. To fly later, you&apos;ll need to book again.</li>
        </ul>

        <div className="mt-6">
          {problem ? (
            <p className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{problem}</p>
          ) : (
            <TripActionForm action={cancelTrip} variant="danger" submitLabel="Cancel trip" pendingLabel="Cancelling...">
              <input type="hidden" name="booking_id" value={bookingId} />
            </TripActionForm>
          )}
        </div>
      </Card>
    </>
  );
}
