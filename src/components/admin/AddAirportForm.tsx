"use client";

import { useActionState } from "react";

import { addAirport } from "@/app/employee/admin/airports/actions";

import { adminButtonClass, adminInputClass, adminLabelClass, FormError } from "./AdminTile";

//Similarly to the aircraft add form component, this allows admins to fill in fields to add airports with validations
export function AddAirportForm() {
  const [state, formAction, pending] = useActionState(addAirport, null);
  const typed = state && "error" in state ? state.values : {};

  return (
    <form action={formAction}>
      <div className="grid grid-cols-[5rem_2fr_1fr_5rem_1.5fr_auto] items-end gap-2">
        <label>
          <span className={adminLabelClass}>Code</span>
          <input name="airport_code" defaultValue={typed.airport_code} placeholder="IAH" required maxLength={3} className={`${adminInputClass} uppercase`} />
        </label>
        <label>
          <span className={adminLabelClass}>Name</span>
          <input name="airport_name" defaultValue={typed.airport_name} placeholder="George Bush Intercontinental Airport" required maxLength={100} className={adminInputClass} />
        </label>
        <label>
          <span className={adminLabelClass}>City</span>
          <input name="city" defaultValue={typed.city} placeholder="Houston" required maxLength={50} className={adminInputClass} />
        </label>
        <label>
          <span className={adminLabelClass}>Country</span>
          <input name="country" defaultValue={typed.country} placeholder="US" required maxLength={2} className={`${adminInputClass} uppercase`} />
        </label>
        <label>
          <span className={adminLabelClass}>Time zone</span>
          <input name="timezone" defaultValue={typed.timezone} placeholder="America/Chicago" required maxLength={50} className={adminInputClass} />
        </label>
        <button type="submit" disabled={pending} className={adminButtonClass}>
          {pending ? "Adding..." : "Add"}
        </button>
      </div>
      <FormError message={state && "error" in state ? state.error : undefined} />
    </form>
  );
}
