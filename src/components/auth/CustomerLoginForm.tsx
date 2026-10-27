"use client";

import { useActionState, useEffect } from "react";

import { customerLogin } from "@/app/login/actions";

const labelClass = "mb-1.5 block text-[11px] font-semibold tracking-widest text-gray-600 uppercase";

const inputClass =
  "h-11 w-full rounded-control border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-azure-blue focus:ring-1 focus:ring-azure-blue focus:outline-none";

export function CustomerLoginForm({ next }: { next: string | null }) {
  const [state, formAction, pending] = useActionState(customerLogin, null);
  useEffect(() => {
    if (state?.redirectTo) window.location.assign(state.redirectTo);
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label htmlFor="customer-email" className={labelClass}>
          Email
        </label>
        <input
          id="customer-email"
          name="email"
          type="email"
          defaultValue={state?.email}
          placeholder="you@example.com"
          autoComplete="email"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="customer-password" className={labelClass}>
          Password
        </label>
        <input
          id="customer-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" name="keep_logged_in" defaultChecked className="h-4 w-4 accent-azure-blue" />
        Keep me logged in
      </label>

      {state?.error && (
        <p role="alert" className="rounded-control border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-control bg-azure-blue px-6 text-sm font-semibold tracking-wide text-white hover:bg-azure-blue-dark disabled:opacity-60"
      >
        {pending ? "Logging in..." : "Log In"}
      </button>
    </form>
  );
}
