"use client";

import { useActionState, type ReactNode } from "react";

import { register } from "@/app/register/actions";

const inputClass =
  "h-11 w-full rounded-control border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-azure-blue focus:ring-1 focus:ring-azure-blue focus:outline-none";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, null);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Field id="register-first-name" label="First name">
          <input
            id="register-first-name"
            name="first_name"
            defaultValue={state?.firstName}
            autoComplete="given-name"
            required
            maxLength={50}
            className={inputClass}
          />
        </Field>
        <Field id="register-last-name" label="Last name">
          <input
            id="register-last-name"
            name="last_name"
            defaultValue={state?.lastName}
            autoComplete="family-name"
            required
            maxLength={50}
            className={inputClass}
          />
        </Field>
      </div>

      <Field id="register-email" label="Email">
        <input
          id="register-email"
          name="email"
          type="email"
          defaultValue={state?.email}
          placeholder="you@example.com"
          autoComplete="email"
          required
          maxLength={100}
          className={inputClass}
        />
      </Field>

      <Field id="register-phone" label="Phone number (optional)">
        <input
          id="register-phone"
          name="phone"
          type="tel"
          defaultValue={state?.phone}
          placeholder="e.g. +1 713 555 0100"
          autoComplete="tel"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field id="register-password" label="Password">
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={inputClass}
          />
        </Field>
        <Field id="register-confirm" label="Confirm password">
          <input
            id="register-confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={inputClass}
          />
        </Field>
      </div>
      <p className="-mt-3 text-xs text-gray-500">At least 8 characters.</p>

      {state && (
        <p role="alert" className="rounded-control border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-control bg-azure-blue px-6 text-sm font-semibold tracking-wide text-white hover:bg-azure-blue-dark disabled:opacity-60"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[11px] font-semibold tracking-widest text-gray-600 uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}
