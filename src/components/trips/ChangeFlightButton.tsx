"use client";

import Link from "next/link";
import { useState } from "react";

export function ChangeFlightButton({ bookingId, blockedReason }: { bookingId: string; blockedReason: string | null }) {
  const [refused, setRefused] = useState(false);

  if (!blockedReason) {
    return (
      <Link
        href={`/my-trips/${bookingId}/change`}
        className="rounded-control border border-azure-blue px-6 py-2.5 text-sm font-semibold text-azure-blue hover:bg-azure-blue hover:text-white"
      >
        Change flight
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setRefused(true)}
        disabled={refused}
        className="rounded-control border border-azure-blue px-6 py-2.5 text-sm font-semibold text-azure-blue hover:bg-azure-blue hover:text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
      >
        Change flight
      </button>

      {refused && (
        <p role="alert" className="order-last w-full rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {blockedReason}
        </p>
      )}
    </>
  );
}
