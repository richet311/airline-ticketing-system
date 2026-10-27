"use client";

import { useActionState } from "react";

import { findTrip } from "@/app/actions";

const labelClass = "mb-1.5 block text-[11px] font-semibold tracking-widest text-gray-600 uppercase";

const inputClass =
  "h-11 w-full rounded-control border border-gray-300 bg-white px-3 text-[15px] text-gray-900 placeholder:text-gray-400 focus:border-azure-blue focus:ring-1 focus:ring-azure-blue focus:outline-none";

export function CheckInLookupForm({ initialCode = "" }: { initialCode?: string }) {
  const [state, formAction, pending] = useActionState(findTrip, null);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="go_to" value="check-in" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="check-in-code" className={labelClass}>
            Confirmation code
          </label>
          <input
            id="check-in-code"
            name="booking_id"
            defaultValue={state?.bookingId ?? initialCode}
            placeholder="e.g. AZ43AJ"
            required
            minLength={6}
            maxLength={6}
            autoCapitalize="characters"
            className={`${inputClass} font-mono tracking-widest uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case`}
          />
        </div>
        <div>
          <label htmlFor="check-in-last-name" className={labelClass}>
            Last name
          </label>
          <input
            id="check-in-last-name"
            name="last_name"
            defaultValue={state?.lastName}
            required
            autoComplete="family-name"
            className={inputClass}
          />
        </div>
      </div>

      {state && (
        <p role="alert" className="rounded-control border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-control bg-azure-blue px-6 text-[15px] font-semibold tracking-wide text-white hover:bg-azure-blue-dark disabled:opacity-60"
      >
        {pending ? "Searching..." : "Find my trip"}
      </button>
    </form>
  );
}
