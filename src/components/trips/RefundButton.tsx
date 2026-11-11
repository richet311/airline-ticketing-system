"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

import { cancelTrip } from "@/app/my-trips/[bookingId]/cancel/actions";

export function RefundedPopup({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  function handleClose() {
    setOpen(false);
    router.replace(`/my-trips/${bookingId}`);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-card bg-white p-6">
        <p className="font-semibold text-gray-900">Refunded</p>
        <p className="mt-2 text-gray-700">Refunds will be processed in 7-14 days.</p>
        <button
          type="button"
          onClick={handleClose}
          className="mt-6 rounded-control bg-azure-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-azure-blue-dark"
        >
          OK
        </button>
      </div>
    </div>
  );
}

export function RefundButton({ bookingId, blockedReason }: { bookingId: string; blockedReason: string | null }) {
  const [asking, setAsking] = useState(false);
  const [refused, setRefused] = useState(false);
  const [result, refund, pending] = useActionState(cancelTrip, null);

  function handleClick() {
    if (blockedReason) setRefused(true);
    else setAsking(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={refused || result !== null}
        className="rounded-control border border-red-600 px-6 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
      >
        Refund trip
      </button>

      {refused && (
        <p role="alert" className="w-full rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {blockedReason}
        </p>
      )}

      {asking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-card bg-white p-6">
            {result ? (
              <>
                <p role="alert" className="text-gray-900">
                  {result.error}
                </p>
                <button
                  type="button"
                  onClick={() => setAsking(false)}
                  className="mt-6 rounded-control bg-azure-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-azure-blue-dark"
                >
                  OK
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-900">Are you sure you want to refund this trip?</p>
                <div className="mt-6 flex items-start gap-3">
                  <form action={refund}>
                    <input type="hidden" name="booking_id" value={bookingId} />
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-control bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {pending ? "Refunding..." : "Yes, refund"}
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => setAsking(false)}
                    className="rounded-control border border-azure-blue px-6 py-2.5 text-sm font-semibold text-azure-blue hover:bg-azure-blue hover:text-white"
                  >
                    No
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
