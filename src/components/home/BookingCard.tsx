"use client";

import Form from "next/form";
import { useActionState, useState, type ReactNode } from "react";

import { findTrip } from "@/app/actions";

const tabs = [
  { id: "book", label: "Book" },
  { id: "check-in", label: "Check In" },
  { id: "my-trips", label: "My Trips" },
  { id: "flight-status", label: "Flight Status" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const inputClass =
  "w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-azure-blue focus:ring-1 focus:ring-azure-blue focus:outline-none disabled:bg-gray-100 disabled:text-gray-400";

const buttonClass =
  "rounded bg-azure-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-azure-blue-dark";

export function BookingCard() {
  const [activeTab, setActiveTab] = useState<TabId>("book");

  return (
    <div className="overflow-hidden rounded-lg bg-white text-gray-900 shadow-xl">
      <div role="tablist" aria-label="Plan your trip" className="flex border-b border-gray-200 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={tab.id === activeTab}
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${
              tab.id === activeTab ? "border-azure-blue text-azure-navy" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-labelledby={`tab-${activeTab}`} className="p-5">
        {activeTab === "book" && <BookForm />}
        {activeTab === "check-in" && (
          <TripLookupForm goTo="check-in" submitLabel="Check in" note="Check-in opens 24 hours before departure." />
        )}
        {activeTab === "my-trips" && (
          <TripLookupForm goTo="my-trips" submitLabel="Find trip" note="No account needed: use your confirmation code." />
        )}
        {activeTab === "flight-status" && <FlightStatusForm />}
      </div>
    </div>
  );
}

function BookForm() {
  const [trip, setTrip] = useState<"round" | "one-way">("round");

  return (
    <Form action="/book/results">
      <fieldset className="mb-4 flex gap-6 text-sm">
        <legend className="sr-only">Trip type</legend>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="trip"
            value="round"
            checked={trip === "round"}
            onChange={() => setTrip("round")}
            className="accent-azure-blue"
          />
          Round trip
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="trip"
            value="one-way"
            checked={trip === "one-way"}
            onChange={() => setTrip("one-way")}
            className="accent-azure-blue"
          />
          One way
        </label>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Field label="From">
          <input name="from" defaultValue="IAH" placeholder="City or airport" required className={inputClass} />
        </Field>
        <Field label="To">
          <input name="to" placeholder="City or airport" required className={inputClass} />
        </Field>
        <Field label="Depart">
          <input type="date" name="depart" required className={inputClass} />
        </Field>
        <Field label="Return">
          <input
            type="date"
            name="return"
            required={trip === "round"}
            disabled={trip === "one-way"}
            className={inputClass}
          />
        </Field>
        <Field label="Passengers">
          <select name="passengers" defaultValue="1" className={inputClass}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? "Passenger" : "Passengers"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cabin">
          <select name="cabin" defaultValue="ECONOMY" className={inputClass}>
            <option value="ECONOMY">Economy</option>
            <option value="PREMIUM">Premium</option>
            <option value="BUSINESS">Business</option>
            <option value="FIRST">First</option>
          </select>
        </Field>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">Prices include taxes and fees for 1 adult.</p>
        <button type="submit" className={buttonClass}>
          Find Flights
        </button>
      </div>
    </Form>
  );
}

function TripLookupForm({
  goTo,
  submitLabel,
  note,
}: {
  goTo: "check-in" | "my-trips";
  submitLabel: string;
  note: string;
}) {
  const [state, formAction, pending] = useActionState(findTrip, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="go_to" value={goTo} />
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Confirmation code">
          <input
            name="booking_id"
            defaultValue={state?.bookingId}
            placeholder="e.g. AZ42KQ"
            required
            minLength={6}
            maxLength={6}
            autoCapitalize="characters"
            className={`${inputClass} uppercase`}
          />
        </Field>
        <Field label="Last name">
          <input
            name="last_name"
            defaultValue={state?.lastName}
            required
            autoComplete="family-name"
            className={inputClass}
          />
        </Field>
        <button type="submit" disabled={pending} className={`${buttonClass} disabled:opacity-60`}>
          {pending ? "Searching..." : submitLabel}
        </button>
      </div>
      {state && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <p className="mt-3 text-xs text-gray-500">{note}</p>
    </form>
  );
}

function FlightStatusForm() {
  return (
    <Form action="/flight-status">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Flight number">
          <input
            name="flight_number"
            placeholder="e.g. AZ101"
            required
            autoCapitalize="characters"
            className={`${inputClass} uppercase`}
          />
        </Field>
        <Field label="Date">
          <input type="date" name="date" required className={inputClass} />
        </Field>
        <button type="submit" className={buttonClass}>
          Check status
        </button>
      </div>
      <p className="mt-3 text-xs text-gray-500">Gate and times can change. Check again before you leave.</p>
    </Form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">{label}</span>
      {children}
    </label>
  );
}
