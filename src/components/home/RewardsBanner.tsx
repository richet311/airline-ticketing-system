import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";

export function RewardsBanner() {
  return (
    <section
      aria-labelledby="rewards-heading"
      className="overflow-hidden border-b border-gray-200 bg-linear-to-r from-azure-sky via-white to-azure-sky"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-[1.15fr_1fr] items-center gap-12 px-4 py-16">
        <div>
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

        <MemberCards />
      </div>
    </section>
  );
}

function MemberCards() {
  return (
    <div aria-hidden="true" className="relative mx-auto h-64 w-full max-w-md">
      <div className="absolute top-2 right-0 aspect-[1.586] w-80 rotate-6 rounded-xl bg-linear-to-br from-[#e3c77d] to-azure-gold shadow-lg" />
      <div className="absolute bottom-0 left-0 flex aspect-[1.586] w-80 -rotate-3 flex-col justify-between rounded-xl bg-linear-to-br from-azure-hero to-azure-navy p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between">
          <p className="text-sm font-semibold tracking-[0.18em]">AZURE AIR</p>
          <p className="text-[10px] font-semibold tracking-widest text-azure-gold uppercase">Rewards</p>
        </div>
        <div className="h-7 w-10 rounded-md bg-linear-to-br from-[#e3c77d] to-azure-gold" />
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] tracking-widest text-white/60 uppercase">Member</p>
            <p className="text-sm font-semibold">Your name here</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-widest text-white/60 uppercase">Points</p>
            <p className="text-lg font-semibold">0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
