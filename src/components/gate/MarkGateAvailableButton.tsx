"use client";

import { useState, useTransition } from "react";

import { markGateAvailable } from "@/app/employee/agent/gate/[flightId]/actions";
import { adminButtonClass } from "@/components/admin/AdminTile";

export function MarkGateAvailableButton({ gateId, label }: { gateId: number; label: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function markAvailable() {
    setError(null);
    startTransition(async () => {
      const result = await markGateAvailable({ gateId });
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={markAvailable}
        aria-label={`Mark gate ${label} available`}
        className={`${adminButtonClass} h-8 px-3 text-xs disabled:bg-gray-300`}
      >
        {pending ? "Saving..." : "Mark available"}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </>
  );
}
