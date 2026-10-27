"use client";

import { useActionState, useState } from "react";

import { checkIn } from "@/app/check-in/[bookingId]/actions";

export type CheckInTraveler = {
  eTicketNumber: string;
  name: string;
  seat: string | null;
  problem: string | null;
};

export function CheckInForm({ bookingId, travelers }: { bookingId: string; travelers: CheckInTraveler[] }) {
  const [state, formAction, pending] = useActionState(checkIn, null);
  // everyone who's ready starts ticked
  const [chosen, setChosen] = useState<string[]>(
    travelers.filter((traveler) => traveler.problem === null).map((traveler) => traveler.eTicketNumber),
  );
  const [hazmat, setHazmat] = useState(false);

  function toggle(eTicketNumber: string) {
    setChosen(
      chosen.includes(eTicketNumber) ? chosen.filter((number) => number !== eTicketNumber) : [...chosen, eTicketNumber],
    );
  }

  const buttonLabel = chosen.length > 1 ? `Check in ${chosen.length} travelers` : "Complete check-in";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="booking_id" value={bookingId} />

      {travelers.length === 1 ? (
        chosen.length === 1 && <input type="hidden" name="e_ticket_number" value={chosen[0]} />
      ) : (
        <fieldset className="rounded-card border border-gray-200 bg-white shadow-card">
          <legend className="sr-only">Who&apos;s checking in</legend>
          {travelers.map((traveler) => (
            <label
              key={traveler.eTicketNumber}
              className={`flex items-center gap-3 border-t border-gray-200 px-5 py-3 first-of-type:border-t-0 ${
                traveler.problem ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <input
                type="checkbox"
                name="e_ticket_number"
                value={traveler.eTicketNumber}
                checked={chosen.includes(traveler.eTicketNumber)}
                disabled={traveler.problem !== null}
                onChange={() => toggle(traveler.eTicketNumber)}
                className="h-4 w-4 accent-azure-blue"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-azure-navy">{traveler.name}</span>
                <span className={`block text-sm ${traveler.problem ? "text-red-700" : "text-gray-600"}`}>
                  {traveler.problem ?? `Seat ${traveler.seat}`}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <label className="flex items-start gap-3 text-[15px] text-gray-800">
        <input
          type="checkbox"
          name="hazmat"
          checked={hazmat}
          onChange={(event) => setHazmat(event.target.checked)}
          className="mt-1 h-4 w-4 accent-azure-blue"
        />
        I&apos;m not carrying hazardous materials, and I&apos;ve read the baggage rules.
      </label>

      {state && (
        <p role="alert" className="rounded-control border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !hazmat || chosen.length === 0}
        className="h-13 w-full rounded-control bg-azure-blue px-6 text-base font-semibold text-white hover:bg-azure-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Checking in..." : buttonLabel}
      </button>
    </form>
  );
}
