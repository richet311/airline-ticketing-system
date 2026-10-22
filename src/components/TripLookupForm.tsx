"use client";

import { useActionState } from "react";

import { findTrip } from "@/app/actions";
import { FieldBox, fieldControlClass } from "@/components/FieldBox";

const buttonClass =
  "h-16 rounded-control bg-azure-blue px-8 text-[15px] font-semibold tracking-wide text-white hover:bg-azure-blue-dark disabled:opacity-60";

export function TripLookupForm({ goTo, submitLabel }: { goTo: "check-in" | "my-trips"; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(findTrip, null);

  return (
    <form action={formAction} className="rounded-card border border-gray-200 bg-white p-6 text-gray-900 shadow-card">
      <input type="hidden" name="go_to" value={goTo} />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3">
        <FieldBox label="Confirmation code">
          <input
            name="booking_id"
            defaultValue={state?.bookingId}
            placeholder="e.g. AZ42KQ"
            required
            minLength={6}
            maxLength={6}
            autoCapitalize="characters"
            className={`${fieldControlClass} uppercase placeholder:normal-case`}
          />
        </FieldBox>
        <FieldBox label="Last name">
          <input
            name="last_name"
            defaultValue={state?.lastName}
            required
            autoComplete="family-name"
            className={fieldControlClass}
          />
        </FieldBox>
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Searching..." : submitLabel}
        </button>
      </div>
      {state && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
