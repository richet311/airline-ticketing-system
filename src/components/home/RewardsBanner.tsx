import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";

export function RewardsBanner() {
  return (
    <section
      aria-labelledby="rewards-heading"
      className="border-b border-gray-200 bg-linear-to-r from-azure-sky via-white to-azure-sky"
    >
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-[13px] font-semibold tracking-widest text-azure-blue uppercase">Azure Rewards</p>
        <h2 id="rewards-heading" className="mt-3 text-5xl leading-tight font-semibold text-azure-navy">
          Earn points on every flight.
        </h2>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-gray-700">
          Create a free account to save travelers, manage trips in one place, and collect loyalty points you can use
          on future bookings.
        </p>
        <div className="mt-8 flex items-center gap-6">
          <Link
            href="/register"
            className="rounded-control bg-azure-blue px-7 py-3.5 text-sm font-semibold tracking-wide text-white hover:bg-azure-blue-dark"
          >
            Join for free
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm font-semibold text-azure-blue hover:text-azure-blue-dark hover:underline"
          >
            Already a member? Log in
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
