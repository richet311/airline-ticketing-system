"use client";

import { useActionState } from "react";

import { addAircraft } from "@/app/employee/admin/aircraft/actions";
import { PLANE_ROWS, SEATS_PER_ROW } from "@/lib/planeRows";

import { adminButtonClass, adminInputClass, adminLabelClass, FormError } from "./AdminTile";

//This goes above the System Admin's view of all aircraft in our db and allows them to fill in fields to add one with validations
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
        <div>
          <span className={adminLabelClass}>Seats (A-F)</span>
          <output className={`${adminInputClass} flex items-center bg-gray-50`}>
            {PLANE_ROWS} rows · {PLANE_ROWS * SEATS_PER_ROW}
          </output>
        </div>
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
