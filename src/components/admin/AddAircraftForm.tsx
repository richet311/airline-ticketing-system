"use client";

import { useActionState, useState } from "react";

import { addAircraft } from "@/app/employee/admin/aircraft/actions";
import { MAX_ROWS, MIN_ROWS, SEATS_PER_ROW } from "@/lib/planeRows";
import type { AdminFormState } from "@/lib/types";

import { adminButtonClass, adminInputClass, adminLabelClass, FormError } from "./AdminTile";

//This goes above the System Admin's view of all aircraft in our db and allows them to fill in fields to add one with validations
export function AddAircraftForm({ statuses }: { statuses: string[] }) {
  const [rows, setRows] = useState("");
  const [state, formAction, pending] = useActionState(async (previous: AdminFormState, formData: FormData) => {
    const result = await addAircraft(previous, formData);
    if (result && "ok" in result) setRows("");
    return result;
  }, null);
  const typed = state && "error" in state ? state.values : {};
  const seats = Number(rows) * SEATS_PER_ROW;

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
          <span className={adminLabelClass}>Rows (A-F)</span>
          <input
            name="rows"
            type="number"
            min={MIN_ROWS}
            max={MAX_ROWS}
            value={rows}
            onChange={(event) => setRows(event.target.value)}
            placeholder={`${MIN_ROWS} to ${MAX_ROWS}`}
            required
            className={adminInputClass}
          />
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
      {seats > 0 && <p className="mt-1 text-xs text-gray-500">{seats} seats</p>}
      <FormError message={state && "error" in state ? state.error : undefined} />
    </form>
  );
}
