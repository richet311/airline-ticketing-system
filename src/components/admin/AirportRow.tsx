"use client";

import { useState, useTransition } from "react";

import { deleteAirport, updateAirport } from "@/app/employee/admin/airports/actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Airport } from "@/lib/types";

import { adminInputClass } from "./AdminTile";

export function AirportRow({ airport }: { airport: Airport }) {
  const [code, setCode] = useState(airport.airport_code);
  const [name, setName] = useState(airport.airport_name);
  const [city, setCity] = useState(airport.city);
  const [country, setCountry] = useState(airport.country);
  const [timezone, setTimezone] = useState(airport.timezone);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [pending, startTransition] = useTransition();
  const changed =
    code !== airport.airport_code ||
    name !== airport.airport_name ||
    city !== airport.city ||
    country !== airport.country ||
    timezone !== airport.timezone;

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateAirport({ airportId: airport.airport_id, code, name, city, country, timezone });
      if (!result.ok) setMessage(result.error);
    });
  }

  function remove() {
    setMessage(null);
    startTransition(async () => {
      const result = await deleteAirport(airport.airport_id);
      if (!result.ok) setMessage(result.error);
    });
  }

  return (
    <tr className="align-top">
      <td className="w-20 py-2 pr-3">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          maxLength={3}
          aria-label="Airport code"
          className={`${adminInputClass} font-semibold uppercase`}
        />
      </td>
      <td className="py-2 pr-3">
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} aria-label="Airport name" className={adminInputClass} />
      </td>
      <td className="w-36 py-2 pr-3">
        <input value={city} onChange={(event) => setCity(event.target.value)} maxLength={50} aria-label="City" className={adminInputClass} />
      </td>
      <td className="w-16 py-2 pr-3">
        <input
          value={country}
          onChange={(event) => setCountry(event.target.value.toUpperCase())}
          maxLength={2}
          aria-label="Country"
          className={`${adminInputClass} uppercase`}
        />
      </td>
      <td className="w-44 py-2 pr-3">
        <input value={timezone} onChange={(event) => setTimezone(event.target.value)} maxLength={50} aria-label="Time zone" className={adminInputClass} />
      </td>
      <td className="py-2 text-right whitespace-nowrap">
        <button type="button" onClick={save} disabled={!changed || pending} className="mr-3 font-semibold text-azure-blue hover:underline disabled:text-gray-400 disabled:no-underline">
          {pending ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={() => setConfirmingRemove(true)} disabled={pending} className="font-semibold text-red-700 hover:underline disabled:opacity-60">
          Remove
        </button>
        {message && (
          <p role="alert" className="mt-1 w-56 text-left text-xs whitespace-normal text-red-700">
            {message}
          </p>
        )}
        <ConfirmDialog
          open={confirmingRemove}
          title={`Remove ${airport.airport_code}?`}
          message="Its terminals and gates are removed too."
          confirmLabel="Remove airport"
          cancelLabel="Keep airport"
          onConfirm={() => {
            setConfirmingRemove(false);
            remove();
          }}
          onCancel={() => setConfirmingRemove(false)}
        />
      </td>
    </tr>
  );
}
