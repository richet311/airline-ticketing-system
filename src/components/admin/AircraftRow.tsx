"use client";

import { useState, useTransition } from "react";

import { deleteAircraft, updateAircraft } from "@/app/employee/admin/aircraft/actions";
import type { AircraftListRow } from "@/lib/types";

import { adminInputClass } from "./AdminTile";

export function AircraftRow({ plane, statuses }: { plane: AircraftListRow; statuses: string[] }) {
  const [type, setType] = useState(plane.aircraft_type);
  const [status, setStatus] = useState(plane.maintenance_status_name);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const changed = type !== plane.aircraft_type || status !== plane.maintenance_status_name;

  function save() {
    const leaving = plane.maintenance_status_name === "OPERATIONAL" && status !== "OPERATIONAL";
    if (leaving && !window.confirm(`Take ${plane.aircraft_number} out of service? Its upcoming flights move to a free aircraft with the same number of seats.`)) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await updateAircraft({ aircraftId: plane.aircraft_id, type, status });
      if (!result.ok) setMessage(result.error);
    });
  }

  function remove() {
    if (!window.confirm(`Delete ${plane.aircraft_number}? Its upcoming flights move to a free aircraft with the same number of seats.`)) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteAircraft(plane.aircraft_id);
      if (!result.ok) setMessage(result.error);
    });
  }

  return (
    <tr className="align-top">
      <td className="py-2 pr-4 font-semibold">{plane.aircraft_number}</td>
      <td className="py-2 pr-4">
        <input value={type} onChange={(event) => setType(event.target.value)} maxLength={50} aria-label="Aircraft type" className={adminInputClass} />
      </td>
      <td className="py-2 pr-4">{plane.capacity}</td>
      <td className="py-2 pr-4">
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Aircraft status" className={adminInputClass}>
          {statuses.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </td>
      <td className="py-2 text-right whitespace-nowrap">
        <button type="button" onClick={save} disabled={!changed || pending} className="mr-3 font-semibold text-azure-blue hover:underline disabled:text-gray-400 disabled:no-underline">
          {pending ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={remove} disabled={pending} className="font-semibold text-red-700 hover:underline disabled:opacity-60">
          Delete
        </button>
        {message && (
          <p role="alert" className="mt-1 w-56 text-left text-xs whitespace-normal text-red-700">
            {message}
          </p>
        )}
      </td>
    </tr>
  );
}
