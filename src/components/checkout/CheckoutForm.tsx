"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";

import { purchase } from "@/app/book/checkout/actions";
import { PointsBox, type CheckoutRewards } from "@/components/rewards/PointsBox";
import { bagFee, CHECKED_BAG_FEES } from "@/lib/baggageFees";
import type { FareOption, FlightStatusRow, UpgradeType } from "@/lib/types";

const inputClass =
  "h-11 w-full rounded-control border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-azure-blue focus:ring-1 focus:ring-azure-blue focus:outline-none";

// must match check_payment_method in schema.sql
const PAYMENT_METHODS = [
  { value: "CREDIT", label: "Credit card" },
  { value: "DEBIT", label: "Debit card" },
  { value: "PAYPAL", label: "PayPal" },
];

type TripLeg = { label: string; flight: FlightStatusRow; fare: FareOption; seats: string[] };

export function CheckoutForm({
  rewards,
  passengers,
  legs,
  upgrades,
  outbound,
  returnFare,
  outboundSeats,
  returnSeats,
  idempotencyKey,
}: {
  rewards: CheckoutRewards | null;
  passengers: number;
  legs: TripLeg[];
  upgrades: UpgradeType[];
  outbound: number;
  returnFare: number | null;
  outboundSeats: string[];
  returnSeats: string[];
  idempotencyKey: string;
}) {
  const [bags, setBags] = useState<number[]>(() => Array.from({ length: passengers }, () => 0));
  const [chosenUpgrades, setChosenUpgrades] = useState<number[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CREDIT");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const fareTotal = legs.reduce((sum, leg) => sum + leg.fare.base_price * passengers, 0);
  const upgradeTotal = upgrades
    .filter((upgrade) => chosenUpgrades.includes(upgrade.upgrade_id))
    .reduce((sum, upgrade) => sum + upgrade.upgrade_price, 0);
  const bagTotal = bags.reduce((sum, count) => sum + bagFee(count), 0) * legs.length;
  const total = fareTotal + upgradeTotal + bagTotal;
  const bagCount = bags.reduce((sum, count) => sum + count, 0) * legs.length;

  function toggleUpgrade(upgradeId: number) {
    setChosenUpgrades((current) =>
      current.includes(upgradeId) ? current.filter((id) => id !== upgradeId) : [...current, upgradeId],
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage(null);
    startTransition(async () => {
      const result = await purchase(formData);
      if (result && !result.ok) {
        setMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-[1fr_20rem] items-start gap-6">
      <input type="hidden" name="outbound" value={outbound} />
      {returnFare !== null && <input type="hidden" name="return" value={returnFare} />}
      <input type="hidden" name="passengers" value={passengers} />
      <input type="hidden" name="outbound_seats" value={outboundSeats.join(",")} />
      <input type="hidden" name="return_seats" value={returnSeats.join(",")} />
      <input type="hidden" name="idempotency_key" value={idempotencyKey} />

      <div className="space-y-6">
        <Section number={3} title="Who's flying">
          <p className="mb-4 text-xs text-gray-500">
            Enter each name exactly as it appears on the traveler&apos;s passport. Traveler 1 is the contact for
            this booking: use their last name to find it in My Trips.
          </p>
          <div className="space-y-6">
            {Array.from({ length: passengers }, (_, i) => (
              <TravelerFields key={i} index={i} legs={legs} />
            ))}
          </div>
        </Section>

        <Section number={4} title="Extras">
          <h3 className="mb-1 text-sm font-semibold text-gray-900">Checked bags</h3>
          <p className="mb-3 text-xs text-gray-500">
            Per traveler, on every flight of your trip. 1st bag {feeLabel(CHECKED_BAG_FEES[0])}, 2nd bag{" "}
            {feeLabel(CHECKED_BAG_FEES[1])}. Up to 50 lb each.
          </p>
          <ul className="mb-6 divide-y divide-gray-100 rounded-control border border-gray-200">
            {bags.map((count, i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-4 py-2 text-sm">
                <span className="text-gray-900">Traveler {i + 1}</span>
                <select
                  name={`bags_${i}`}
                  value={count}
                  onChange={(event) => setBags(bags.map((old, j) => (j === i ? Number(event.target.value) : old)))}
                  className={`${inputClass} max-w-48`}
                >
                  {Array.from({ length: CHECKED_BAG_FEES.length + 1 }, (_, n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "bag" : "bags"}
                      {n > 0 && ` · ${feeLabel(bagFee(n))}`}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>

          <h3 className="mb-1 text-sm font-semibold text-gray-900">Upgrades</h3>
          <p className="mb-3 text-xs text-gray-500">One price for the whole booking.</p>
          <div className="grid grid-cols-2 gap-3">
            {upgrades.map((upgrade) => {
              const checked = chosenUpgrades.includes(upgrade.upgrade_id);
              return (
                <label
                  key={upgrade.upgrade_id}
                  className={`flex cursor-pointer gap-3 rounded-card border p-3 ${
                    checked ? "border-azure-blue bg-azure-sky" : "border-gray-200 hover:border-azure-blue"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="upgrade"
                    value={upgrade.upgrade_id}
                    checked={checked}
                    onChange={() => toggleUpgrade(upgrade.upgrade_id)}
                    className="mt-1 accent-azure-blue"
                  />
                  <span className="flex-1">
                    <span className="flex justify-between gap-2 text-sm font-semibold text-gray-900">
                      {upgrade.upgrade_name}
                      <span>{formatPrice(upgrade.upgrade_price)}</span>
                    </span>
                    <span className="block text-xs text-gray-500">{upgrade.upgrade_description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </Section>

        <Section number={5} title="Payment">
          <p className="mb-4 rounded-control border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Test payment: no money is charged and card details are never saved. Any card number of 12 to 19
            digits works, for example 4242 4242 4242 4242.
          </p>

          <div className="mb-4 flex gap-3">
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method.value}
                className={`flex cursor-pointer items-center gap-2 rounded-control border px-4 py-2 text-sm ${
                  paymentMethod === method.value
                    ? "border-azure-blue bg-azure-sky font-semibold text-azure-navy"
                    : "border-gray-300 text-gray-700 hover:border-azure-blue"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value={method.value}
                  checked={paymentMethod === method.value}
                  onChange={() => setPaymentMethod(method.value)}
                  className="accent-azure-blue"
                />
                {method.label}
              </label>
            ))}
          </div>

          {paymentMethod === "PAYPAL" ? (
            <p className="text-sm text-gray-600">In test mode, PayPal payments are approved straight away.</p>
          ) : (
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-3">
              <div className="col-span-3">
                <Field label="Name on card">
                  <input name="card_name" required autoComplete="cc-name" className={inputClass} />
                </Field>
              </div>
              <Field label="Card number">
                <input
                  name="card_number"
                  required
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4242 4242 4242 4242"
                  pattern="[0-9 \-]{12,23}"
                  className={inputClass}
                />
              </Field>
              <Field label="Expiry">
                <input
                  name="card_expiry"
                  required
                  autoComplete="cc-exp"
                  placeholder="MM/YY"
                  pattern="\d{2}/\d{2}"
                  className={inputClass}
                />
              </Field>
              <Field label="CVC">
                <input
                  name="card_cvc"
                  required
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  pattern="\d{3,4}"
                  className={inputClass}
                />
              </Field>
            </div>
          )}
        </Section>
      </div>

      <aside className="space-y-4">
        <div className="rounded-card border border-gray-200 bg-white shadow-card p-5">
          <h2 className="mb-3 font-semibold text-azure-navy">Your trip</h2>
          {legs.map(({ label, flight, fare, seats }) => (
            <div key={flight.flight_id} className="mb-3 last:mb-0">
              <p className="text-sm font-semibold text-gray-900">
                {label} · {flight.departure_time.slice(0, 10)}
              </p>
              <p className="text-xs text-gray-500">
                {flight.origin} {flight.departure_time.slice(11, 16)} → {flight.destination}{" "}
                {flight.arrival_time.slice(11, 16)} UTC · {flight.flight_number}
              </p>
              <p className="text-xs text-gray-500">
                {cabinLabel(fare.cabin_class_name)} · Seats {seats.join(", ")}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-card border border-gray-200 bg-white shadow-card p-5 text-sm">
          {legs.map(({ label, fare }) => (
            <PriceLine
              key={fare.fare_class_id}
              label={`${label} fare (${passengers} × ${formatPrice(fare.base_price)})`}
              amount={fare.base_price * passengers}
            />
          ))}
          <PriceLine label="Seats" text="Included" />
          {bagCount > 0 && (
            <PriceLine label={`Checked bags (${bagCount})`} amount={bagTotal} />
          )}
          {upgrades
            .filter((upgrade) => chosenUpgrades.includes(upgrade.upgrade_id))
            .map((upgrade) => (
              <PriceLine key={upgrade.upgrade_id} label={upgrade.upgrade_name} amount={upgrade.upgrade_price} />
            ))}
          <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 font-semibold text-azure-navy">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {legs.length} {legs.length === 1 ? "flight" : "flights"} · {passengers}{" "}
            {passengers === 1 ? "passenger" : "passengers"} · taxes included
          </p>
        </div>

        <PointsBox rewards={rewards} total={total} />

        {message && (
          <p role="alert" className="rounded-control border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-control bg-azure-blue px-6 py-3 text-sm font-semibold text-white enabled:hover:bg-azure-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Processing..." : `Purchase · ${formatPrice(total)}`}
        </button>
        <p className="text-xs text-gray-500">
          All fares are fully refundable. Changing cabins costs the cabin&apos;s change fee. See Travel info for the full policy.
        </p>
      </aside>
    </form>
  );
}

function Section({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-gray-200 bg-white shadow-card p-6">
      <h2 className="mb-4 flex items-center gap-3 text-xl font-semibold text-azure-navy">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-azure-navy text-sm text-white">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function TravelerFields({ index, legs }: { index: number; legs: TripLeg[] }) {
  return (
    <fieldset className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
      <legend className="mb-3 text-sm font-semibold text-gray-900">
        Traveler {index + 1}
        <span className="ml-2 font-normal text-gray-500">
          {legs.map((leg) => `${leg.label} seat ${leg.seats[index]}`).join(" · ")}
        </span>
      </legend>
      <div className="grid grid-cols-3 gap-3">
        <Field label="First name">
          <input name={`first_name_${index}`} required maxLength={50} autoComplete={index === 0 ? "given-name" : "off"} className={inputClass} />
        </Field>
        <Field label="Last name">
          <input name={`last_name_${index}`} required maxLength={50} autoComplete={index === 0 ? "family-name" : "off"} className={inputClass} />
        </Field>
        <Field label="Date of birth">
          <input type="date" name={`date_of_birth_${index}`} required className={inputClass} />
        </Field>
        <Field label="Nationality">
          <input
            name={`nationality_${index}`}
            required
            minLength={2}
            maxLength={2}
            placeholder="e.g. US"
            pattern="[A-Za-z]{2}"
            title="2-letter country code, like US"
            className={`${inputClass} uppercase`}
          />
        </Field>
        <Field label="Passport number">
          <input
            name={`passport_number_${index}`}
            required
            minLength={8}
            maxLength={9}
            pattern="[A-Za-z0-9]{8,9}"
            title="8 or 9 letters and digits"
            className={`${inputClass} uppercase`}
          />
        </Field>
        <Field label="Passport expiry">
          <input type="date" name={`passport_expiry_${index}`} required className={inputClass} />
        </Field>
      </div>
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold tracking-widest text-gray-600 uppercase">{label}</span>
      {children}
    </label>
  );
}

function PriceLine({ label, amount, text }: { label: string; amount?: number; text?: string }) {
  return (
    <div className="mt-1 flex justify-between gap-3 text-gray-700 first:mt-0">
      <span>{label}</span>
      <span>{text ?? formatPrice(amount ?? 0)}</span>
    </div>
  );
}

// "ECONOMY" -> "Economy"
function cabinLabel(cabin: string): string {
  return cabin.charAt(0) + cabin.slice(1).toLowerCase();
}

// 0 -> "free", 35 -> "$35.00"
function feeLabel(fee: number): string {
  return fee === 0 ? "free" : formatPrice(fee);
}

// 467 -> "$467.00"
function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
