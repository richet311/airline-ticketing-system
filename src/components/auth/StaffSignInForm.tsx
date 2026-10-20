"use client";

import { useActionState } from "react";

import { staffSignIn } from "@/app/login/employee/actions";

const labelClass = "mb-1.5 block text-[11px] font-semibold tracking-widest text-white/80 uppercase";

const inputClass =
  "h-11 w-full rounded-control border border-white bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-sky-300 focus:outline-none";

export function StaffSignInForm() {
  const [state, formAction, pending] = useActionState(staffSignIn, null);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="staff-identifier" className={labelClass}>
          Employee ID or work email
        </label>
        <input
          id="staff-identifier"
          name="identifier"
          defaultValue={state?.identifier}
          placeholder="e.g. 2001"
          autoComplete="username"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="staff-password" className={labelClass}>
          Password
        </label>
        <input
          id="staff-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>

      {state && (
        <p role="alert" className="rounded-control border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-control bg-white px-6 text-sm font-semibold tracking-wide text-azure-navy hover:bg-azure-sky disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
