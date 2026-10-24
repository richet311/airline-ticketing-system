"use client";

import { useActionState } from "react";

import { addAircraft } from "@/app/employee/admin/aircraft/actions";

import { adminButtonClass, adminInputClass, adminLabelClass, FormError } from "./AdminTile";

// The blank row at the top of the Aircraft tile. On success the row clears and the page
// reloads with the new aircraft in the table; on error it keeps what was typed.
export function AddAircraftForm({ statuses }: { statuses: string[] }) {
  const [state, formAction, pending] = useActionState(addAircraft, null);
  const typed = state && "error" in state ? state.values : {};

  return (
    <form action={formAction}>
      <div className="grid grid-cols-[1fr_2fr_7rem_10rem_auto] items-end gap-2">
        <label>
          <span className={adminLabelClass}>Number</span>
          <input name="aircraft_number" defaultValue={typed.aircraft_number} placeholder="N123DL" required maxLength={10} className={`${adminInputClass} uppercase`} />
        </label>
        <label>
          <span className={adminLabelClass}>Type</span>
          <input name="aircraft_type" defaultValue={typed.aircraft_type} placeholder="Boeing small" required maxLength={50} className={adminInputClass} />
        </label>
        <label>
          <span className={adminLabelClass}>Capacity</span>
          <input name="capacity" type="number" min={6} max={8} step={2} defaultValue={typed.capacity} placeholder="6 or 8" required className={adminInputClass} />
        </label>
        <label>
          <span className={adminLabelClass}>Status</span>
          <select name="status" defaultValue={typed.status ?? "OPERATIONAL"} className={adminInputClass}>
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={pending} className={adminButtonClass}>
          {pending ? "Adding..." : "Add"}
        </button>
      </div>
      <FormError message={state && "error" in state ? state.error : undefined} />
    </form>
  );
}
