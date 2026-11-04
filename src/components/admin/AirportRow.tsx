"use client";

import { useState, useTransition } from "react";

import { updateAirport } from "@/app/employee/admin/airports/actions";
import type { Airport } from "@/lib/types";

import { adminInputClass } from "./AdminTile";

export function AirportRow({ airport }: { airport: Airport }) {
  const [code, setCode] = useState(airport.airport_code);
  const [name, setName] = useState(airport.airport_name);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const changed = code !== airport.airport_code || name !== airport.airport_name;

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateAirport({ airportId: airport.airport_id, code, name });
      if (!result.ok) setMessage(result.error);
    });
  }

  return (
    <tr className="align-top">
      <td className="w-24 py-2 pr-4">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          maxLength={3}
          aria-label="Airport code"
          className={`${adminInputClass} font-semibold uppercase`}
        />
      </td>
      <td className="py-2 pr-4">
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} aria-label="Airport name" className={adminInputClass} />
      </td>
      <td className="py-2 pr-4">{airport.city}</td>
      <td className="py-2 pr-4">{airport.country}</td>
      <td className="py-2 pr-4">{airport.timezone}</td>
      <td className="py-2 text-right">
        <button type="button" onClick={save} disabled={!changed || pending} className="font-semibold text-azure-blue hover:underline disabled:text-gray-400 disabled:no-underline">
          {pending ? "Saving..." : "Save"}
        </button>
        {message && (
          <p role="alert" className="mt-1 text-xs text-red-700">
            {message}
          </p>
        )}
      </td>
    </tr>
  );
}
