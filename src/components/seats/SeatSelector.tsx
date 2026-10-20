"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { confirmSeats, holdSeat, releaseSeats } from "@/app/book/seats/actions";
import type { FlightStatusRow, SeatMapRow } from "@/lib/types";

// matches HOLD_MINUTES in actions.ts
const HOLD_SECONDS = 10 * 60;

// front of the plane to the back
const CABIN_ORDER = ["FIRST", "BUSINESS", "PREMIUM", "ECONOMY"];

// TODO: use the signed-in user's name
const TEMP_TRAVELER_NAME = "Guest Traveler";

type SeatLook = "available" | "mine" | "other" | "taken" | "blocked";

const SEAT_CLASSES: Record<SeatLook, string> = {
  available: "border-gray-300 bg-white text-gray-700 enabled:hover:border-azure-blue enabled:hover:bg-azure-blue enabled:hover:text-white",
  mine: "border-azure-blue bg-azure-blue text-white enabled:hover:bg-azure-blue-dark",
  other: "border-blue-200 bg-azure-sky text-azure-navy/50",
  taken: "border-gray-200 bg-gray-200",
  blocked: "border-dashed border-gray-300 bg-white",
};

const LEGEND: { look: SeatLook; label: string }[] = [
  { look: "available", label: "Available" },
  { look: "other", label: "Other seat classes" },
  { look: "mine", label: "Your seat" },
  { look: "taken", label: "Taken" },
  { look: "blocked", label: "Blocked" },
];

type TripFlight = { label: string; flight: FlightStatusRow };

export function SeatSelector({
  seats,
  cabin,
  passengers,
  tripFlights,
  currentFlightId,
  currentFareId,
  fareTotal,
  flightCount,
  leg,
  outbound,
  returnFare,
  outboundSeats,
}: {
  seats: SeatMapRow[];
  cabin: string;
  passengers: number;
  tripFlights: TripFlight[];
  currentFlightId: number;
  currentFareId: number;
  fareTotal: number;
  flightCount: number;
  leg: "outbound" | "return";
  outbound: number;
  returnFare: number | null;
  outboundSeats: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const currentFlight = tripFlights.find((trip) => trip.flight.flight_id === currentFlightId)?.flight;
  const cabinLabel = cabin.charAt(0) + cabin.slice(1).toLowerCase(); // "ECONOMY" -> "Economy"
  const travelerNames = Array.from({ length: passengers }, (_, i) => (i === 0 ? TEMP_TRAVELER_NAME : `Passenger ${i + 1}`));

  function restartTimer() {
    setDeadline(Date.now() + HOLD_SECONDS * 1000);
    setSecondsLeft(HOLD_SECONDS);
  }

  // countdown: at 0:00 the seats are released
  useEffect(() => {
    if (deadline === null) return;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        clearInterval(timer);
        startTransition(async () => {
          await releaseSeats({ flightId: currentFlightId, seatNumbers: selected, keepSeats: [] });
          setSelected([]);
          setDeadline(null);
          setMessage("Your 10-minute hold ran out, so your seats were released. Please choose again.");
          router.refresh();
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline, selected, currentFlightId, router]);

  function clickSeat(seatNumber: string) {
    setMessage(null);

    if (selected.includes(seatNumber)) {
      const keep = selected.filter((seat) => seat !== seatNumber);
      startTransition(async () => {
        await releaseSeats({ flightId: currentFlightId, seatNumbers: [seatNumber], keepSeats: keep });
        setSelected(keep);
        if (keep.length > 0) {
          restartTimer();
        } else {
          setDeadline(null);
        }
      });
      return;
    }

    if (selected.length >= passengers) {
      setMessage(`You've chosen a seat for every passenger. Click one of your seats to give it up first.`);
      return;
    }

    startTransition(async () => {
      const result = await holdSeat({
        flightId: currentFlightId,
        fareClassId: currentFareId,
        seatNumber,
        keepSeats: selected,
      });
      if (result.ok) {
        setSelected([...selected, seatNumber]);
        restartTimer();
      } else {
        setMessage(result.error);
        router.refresh();
      }
    });
  }

  function confirm() {
    startTransition(async () => {
      const result = await confirmSeats({ outbound, returnFare, passengers, leg, outboundSeats, seats: selected });
      if (!result.ok) {
        await releaseSeats({ flightId: currentFlightId, seatNumbers: selected, keepSeats: [] });
        setSelected([]);
        setDeadline(null);
        setMessage(result.error);
        router.refresh();
      }
    });
  }

  const continueLabel = leg === "outbound" && returnFare !== null ? "Continue to return flight seats" : "Continue to checkout";
  const seatCounter = Math.min(selected.length + 1, passengers);

  return (
    <div className="grid grid-cols-[1fr_20rem] items-start gap-6">
      <section className="rounded-card border border-gray-200 bg-white shadow-card p-6">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold text-azure-navy">
            Choose your seat{passengers > 1 && ` (${seatCounter}/${passengers})`}
          </h1>
          {currentFlight && (
            <p className="text-xs text-gray-500">
              {leg === "return" ? "Return" : "Departing"} · {currentFlight.flight_number} · {currentFlight.origin} →{" "}
              {currentFlight.destination} · {currentFlight.departure_time.slice(0, 10)} · {cabinLabel}
            </p>
          )}
        </div>

        <ul className="flex flex-wrap gap-5 text-xs text-gray-600">
          {LEGEND.map((item) => (
            <li key={item.look} className="flex items-center gap-2">
              <span className={`h-4 w-4 rounded-sm border-2 ${SEAT_CLASSES[item.look]}`} />
              {item.label}
            </li>
          ))}
        </ul>

        {message && (
          <p role="alert" className="mt-4 rounded-control border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {message}
          </p>
        )}

        <SeatMap seats={seats} cabin={cabin} selected={selected} disabled={pending} onSeatClick={clickSeat} />
      </section>

      <aside className="space-y-4">
        <div className="rounded-card border border-gray-200 bg-white shadow-card p-5">
          <h2 className="mb-3 font-semibold text-azure-navy">Your trip</h2>
          {tripFlights.map(({ label, flight }) => (
            <div key={flight.flight_id} className="mb-3">
              <p className="text-sm font-semibold text-gray-900">
                {label} · {flight.departure_time.slice(0, 10)}
              </p>
              <p className="text-xs text-gray-500">
                {flight.origin} {flight.departure_time.slice(11, 16)} → {flight.destination}{" "}
                {flight.arrival_time.slice(11, 16)} UTC · {flight.flight_number}
              </p>
            </div>
          ))}

          <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-3">
            <p className="text-sm text-gray-900">{travelerNames.join(", ")}</p>
            <div className="flex flex-wrap justify-end gap-1">
              {selected.map((seat) => (
                <span key={seat} className="rounded-control bg-azure-blue px-2 py-0.5 text-xs font-semibold text-white">
                  {seat}
                </span>
              ))}
            </div>
          </div>
          {leg === "return" && outboundSeats.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">Departing flight seats: {outboundSeats.join(", ")}</p>
          )}

          {selected.length > 0 && (
            <p className="mt-3 rounded-control border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Seat held for you for <strong>{formatCountdown(secondsLeft)}</strong>. Continue before it&apos;s released.
            </p>
          )}
        </div>

        <div className="rounded-card border border-gray-200 bg-white shadow-card p-5 text-sm">
          <div className="flex justify-between text-gray-700">
            <span>Fare ({cabinLabel})</span>
            <span>{formatPrice(fareTotal)}</span>
          </div>
          <div className="mt-1 flex justify-between text-gray-700">
            <span>Seat</span>
            <span>Included</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 font-semibold text-azure-navy">
            <span>Total so far</span>
            <span>{formatPrice(fareTotal)}</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {flightCount} {flightCount === 1 ? "flight" : "flights"} · {passengers}{" "}
            {passengers === 1 ? "passenger" : "passengers"}
          </p>
        </div>

        <button
          type="button"
          onClick={confirm}
          disabled={selected.length !== passengers || pending}
          className="w-full rounded-control bg-azure-blue px-6 py-3 text-sm font-semibold text-white enabled:hover:bg-azure-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {continueLabel}
        </button>
      </aside>
    </div>
  );
}

function SeatMap({
  seats,
  cabin,
  selected,
  disabled,
  onSeatClick,
}: {
  seats: SeatMapRow[];
  cabin: string;
  selected: string[];
  disabled: boolean;
  onSeatClick: (seatNumber: string) => void;
}) {
  const cabins = CABIN_ORDER.filter((name) => seats.some((seat) => seat.cabin_class_name === name));

  return (
    <div className="mx-auto mt-6 w-fit rounded-t-[10rem] rounded-b-3xl border-2 border-gray-200 px-16 pt-24 pb-10">
      {cabins.map((cabinName) => {
        const cabinSeats = seats.filter((seat) => seat.cabin_class_name === cabinName);
        const rows = [...new Set(cabinSeats.map((seat) => parseInt(seat.seat_number)))].sort((a, b) => a - b);

        return (
          <div key={cabinName} className="mb-8 last:mb-0">
            <p className="mb-3 text-center text-[11px] font-semibold tracking-widest text-gray-600 uppercase">{cabinName}</p>
            {rows.map((row) => (
              <div key={row} className="mb-3 flex items-center justify-center gap-4">
                <SeatButton
                  seat={cabinSeats.find((seat) => seat.seat_number === `${row}A`)}
                  cabin={cabin}
                  selected={selected}
                  disabled={disabled}
                  onSeatClick={onSeatClick}
                />
                <span className="w-6 text-center text-xs text-gray-400">{row}</span>
                <SeatButton
                  seat={cabinSeats.find((seat) => seat.seat_number === `${row}B`)}
                  cabin={cabin}
                  selected={selected}
                  disabled={disabled}
                  onSeatClick={onSeatClick}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function SeatButton({
  seat,
  cabin,
  selected,
  disabled,
  onSeatClick,
}: {
  seat: SeatMapRow | undefined;
  cabin: string;
  selected: string[];
  disabled: boolean;
  onSeatClick: (seatNumber: string) => void;
}) {
  if (!seat) return <span className="h-14 w-14" />;

  const look = seatLook(seat, cabin, selected);
  const clickable = look === "available" || look === "mine";

  return (
    <button
      type="button"
      disabled={!clickable || disabled}
      onClick={() => onSeatClick(seat.seat_number)}
      aria-label={`Seat ${seat.seat_number}: ${LEGEND.find((item) => item.look === look)?.label}`}
      className={`h-14 w-14 rounded-md border-2 text-sm font-semibold disabled:cursor-not-allowed ${SEAT_CLASSES[look]}`}
    >
      {look === "taken" || look === "blocked" ? "" : seat.seat_number.slice(-1)}
    </button>
  );
}

// own seats first: after a reload they show as HELD but are still ours
function seatLook(seat: SeatMapRow, cabin: string, selected: string[]): SeatLook {
  if (selected.includes(seat.seat_number)) return "mine";
  if (seat.seat_status_name === "BLOCKED") return "blocked";
  if (seat.seat_status_name !== "AVAILABLE") return "taken"; // BOOKED, or HELD by someone else
  return seat.cabin_class_name === cabin ? "available" : "other";
}

// 562 seconds -> "9:22"
function formatCountdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// 467 -> "$467.00"
function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
