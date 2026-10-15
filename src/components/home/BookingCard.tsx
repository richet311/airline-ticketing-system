"use client";

import Form from "next/form";
import { useActionState, useState, type ReactNode } from "react";

import { findTrip } from "@/app/actions";

// The booking card on Home (mockup Phase 1): four tabs, each one a small search form.
// "use client" because switching tabs and trip type happens in the browser.
// Book and Flight Status open another page with the values in its URL, for example
//   /book/results?trip=round&from=IAH&to=JFK&depart=2026-11-14&return=2026-11-16&passengers=1&cabin=ECONOMY
// and that page reads them with searchParams. Check In and My Trips send the confirmation code
// and last name to findTrip() in src/app/actions.ts, which looks the booking up on the server.

// The four tabs, in order. "as const" keeps each id as that exact text instead of any string,
// so the TabId type below can be built from this list.
const tabs = [
  { id: "book", label: "Book" },
  { id: "check-in", label: "Check In" },
  { id: "my-trips", label: "My Trips" },
  { id: "flight-status", label: "Flight Status" },
] as const;

// TabId (a TypeScript type): "book" | "check-in" | "my-trips" | "flight-status", read from the
// list above. It is the type of the activeTab state, so only a real tab can be active.
// Not stored in the database.
type TabId = (typeof tabs)[number]["id"];

// Tailwind classes shared by every input and button in the card.
const inputClass =
  "w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-azure-blue focus:ring-1 focus:ring-azure-blue focus:outline-none disabled:bg-gray-100 disabled:text-gray-400";

const buttonClass =
  "rounded bg-azure-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-azure-blue-dark";

// No props: Home just shows <BookingCard />.
export function BookingCard() {
  // Which tab is open. useState<TabId> means it can only hold one of the four tab ids.
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

// Book tab: goes to /book/results. No props.
// Each input's name is its name in the URL. What it matches in the database:
// - from, to         airport.airport_code (results are flights with that origin and destination)
// - depart, return   the day of flight.departure_time. Times are stored in UTC, so the results
//                    page converts with airport.timezone before comparing days.
// - passengers       how many seats are needed: compare with fare_class.seats_available
// - cabin            cabin_class.cabin_class_name
// - trip             not stored: a round trip is one booking with a ticket on each flight
function BookForm() {
  // "round" | "one-way" (a type written in place): the trip state can only be one of these two.
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
        {/* Airport codes for now. When the airport list comes from the airport table, this can
            become a picker that shows "Houston, TX (IAH)" and still sends IAH. */}
        <Field label="From">
          <input name="from" defaultValue="IAH" placeholder="City or airport" required className={inputClass} />
        </Field>
        <Field label="To">
          <input name="to" placeholder="City or airport" required className={inputClass} />
        </Field>
        <Field label="Depart">
          <input type="date" name="depart" required className={inputClass} />
        </Field>
        {/* A disabled input is not sent, so one-way searches have no return date in the URL. */}
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
        {/* Values match cabin_class.cabin_class_name in the database. */}
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

// Check In and My Trips tabs: confirmation code + last name, checked by findTrip() on the server.
// Props (the same form is used twice, so the differences are passed in):
// - goTo         the page to open when the trip is found: "check-in" or "my-trips"
// - submitLabel  the button text
// - note         the gray line under the form
// Database:
// - booking_id   booking.booking_id (the 6-character confirmation code)
// - last_name    passenger.last_name of the booking's passenger (booking.passenger_id)
function TripLookupForm({
  goTo,
  submitLabel,
  note,
}: {
  goTo: "check-in" | "my-trips";
  submitLabel: string;
  note: string;
}) {
  // useActionState connects the form to findTrip():
  // - state       what findTrip returned last (null at first): its error and what was typed
  // - formAction  give this to <form action>; it calls findTrip on the server
  // - pending     true while findTrip runs, so the button can say "Searching..."
  const [state, formAction, pending] = useActionState(findTrip, null);

  return (
    <form action={formAction}>
      {/* Not shown: tells findTrip which page to open. */}
      <input type="hidden" name="go_to" value={goTo} />
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        {/* defaultValue puts back what was typed when findTrip returns an error. */}
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

// Flight Status tab: flight number + date, sent to /flight-status. No props.
// Database:
// - flight_number  flight.flight_number
// - date           the day of flight.departure_time (UTC, so convert with airport.timezone)
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

// A small gray label above an input. Wrapping the input in the <label> links the two.
// Props:
// - label     the text above the input
// - children  whatever is written between <Field> and </Field>: here, one input or select.
//             ReactNode is React's type for "anything React can show".
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">{label}</span>
      {children}
    </label>
  );
}
