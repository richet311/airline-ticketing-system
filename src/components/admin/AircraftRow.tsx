"use client";

import { useState, useTransition } from "react";

import { deleteAircraft } from "@/app/employee/admin/aircraft/actions";
import type { AircraftListRow } from "@/lib/types";

export function AircraftRow({ plane }: { plane: AircraftListRow }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm(`Delete ${plane.aircraft_number}? Its flights move to a free aircraft with the same number of seats.`)) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteAircraft(plane.aircraft_id);
      if (!result.ok) setMessage(result.error);
    });
  }

  return (
    <tr className="align-top">
      <td className="py-2 pr-4 font-semibold">{plane.aircraft_number}</td>
      <td className="py-2 pr-4">{plane.aircraft_type}</td>
      <td className="py-2 pr-4">{plane.capacity}</td>
      <td className="py-2 pr-4">{plane.maintenance_status_name}</td>
      <td className="py-2 text-right">
        <button type="button" onClick={remove} disabled={pending} className="font-semibold text-red-700 hover:underline disabled:opacity-60">
          {pending ? "Deleting..." : "Delete"}
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
