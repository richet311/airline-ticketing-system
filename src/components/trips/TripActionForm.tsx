"use client";

import { useActionState, type ReactNode } from "react";

import type { TripActionState } from "@/lib/types";

const BUTTON_CLASSES = {
  primary: "bg-azure-blue text-white hover:bg-azure-blue-dark",
  danger: "bg-red-600 text-white hover:bg-red-700",
  outline: "border border-azure-blue text-azure-blue hover:bg-azure-blue hover:text-white",
};

// A form for one My Trips or Check In action: shows "Working..." while it runs and the error if it's refused
export function TripActionForm({
  action,
  submitLabel,
  pendingLabel = "Working...",
  variant = "primary",
  children,
}: {
  action: (state: TripActionState, formData: FormData) => Promise<TripActionState>;
  submitLabel: string;
  pendingLabel?: string;
  variant?: keyof typeof BUTTON_CLASSES;
  children?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-3">
      {children}
      <button
        type="submit"
        disabled={pending}
        className={`rounded-control px-6 py-2.5 text-sm font-semibold disabled:opacity-60 ${BUTTON_CLASSES[variant]}`}
      >
        {pending ? pendingLabel : submitLabel}
      </button>
      {state && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
