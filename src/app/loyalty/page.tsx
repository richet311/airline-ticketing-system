import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { formatDate, formatMoney } from "@/lib/format";
import { POINTS_PER_DOLLAR, POINTS_PER_DOLLAR_OFF } from "@/lib/rewardPoints";
import { getQualifyingSpend, getRecentActivity, getTiers, nextTier, tierFor, tierLabel, tierPerks } from "@/lib/rewards";
import { getCurrentUser } from "@/lib/session";
import type { CurrentUser, LoyaltyTier } from "@/lib/types";

const STEPS = [
  { title: "Book", text: "Book a flight while you're logged in." },
  { title: "Earn", text: `Get ${POINTS_PER_DOLLAR} points for every $1, plus your tier bonus.` },
  { title: "Move up", text: "Spend more in a year to reach Silver, Gold and Platinum." },
  { title: "Use them", text: `${POINTS_PER_DOLLAR_OFF} points = $1 off a booking. Coming soon.` },
];

// one color per tier for the badge and tier cards
const TIER_COLORS: Record<string, string> = {
  BLUE: "text-azure-blue",
  SILVER: "text-gray-500",
  GOLD: "text-azure-gold",
  PLATINUM: "text-azure-navy",
};

export default function LoyaltyPage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1 bg-azure-page">
        <section className="border-b border-gray-200 bg-linear-to-r from-azure-sky via-white to-azure-sky">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <h1 className="text-5xl leading-tight font-semibold tracking-wide text-azure-navy uppercase">Azure Rewards</h1>
            <p className="mt-3 max-w-xl text-lg leading-relaxed text-gray-700">
              Get {POINTS_PER_DOLLAR} points for every $1 you spend with Azure Air. Your tier is based on what you
              spent in the last 12 months, and your points never expire.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-8">
          <Suspense fallback={<p className="text-gray-500">Loading your rewards...</p>}>
            <Rewards />
          </Suspense>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

async function Rewards() {
  // render at request time (the session check uses Date.now())
  await connection();
  const user = await getCurrentUser();
  const tiers = await getTiers();
  const spend = user ? await getQualifyingSpend(user.user_id) : 0;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_20rem] items-start gap-6">
      <div className="space-y-6">
        {user ? <Balance user={user} spend={spend} tiers={tiers} /> : <SignedOut />}
        <TierCards tiers={tiers} current={user ? tierFor(spend, tiers) : null} />
        {user && <Activity userId={user.user_id} />}
      </div>

      <aside>
        <div className="rounded-card border border-gray-200 bg-white p-6 shadow-card">
          <h2 className="font-semibold text-azure-navy">How it works</h2>
          <ol className="mt-4 space-y-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-azure-navy text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-azure-navy">{step.title}</span>
                  <span className="block text-sm text-gray-600">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}

function Balance({ user, spend, tiers }: { user: CurrentUser; spend: number; tiers: LoyaltyTier[] }) {
  const tier = tierFor(spend, tiers);
  const next = nextTier(tier, tiers);
  // how far between this tier and the next one
  const progress = next
    ? Math.min(100, Math.round(((spend - tier.min_qualifying_spend) / (next.min_qualifying_spend - tier.min_qualifying_spend)) * 100))
    : 100;

  return (
    <section className="rounded-card border border-t-4 border-gray-200 border-t-azure-blue bg-white p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-gray-600 uppercase">
            {user.first_name ? `${user.first_name}'s balance` : "Your balance"}
          </p>
          <p className="mt-1 text-5xl font-semibold text-azure-navy tabular-nums">
            {user.loyalty_points.toLocaleString("en-US")}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            points · worth {formatMoney(user.loyalty_points / POINTS_PER_DOLLAR_OFF)} off
          </p>
        </div>
        <span
          className={`rounded-control border-2 border-current px-3 py-1 text-sm font-semibold tracking-widest uppercase ${TIER_COLORS[tier.tier_name]}`}
        >
          {tierLabel(tier.tier_name)}
        </span>
      </div>

      <div
        className="mt-6 h-2.5 overflow-hidden rounded-full bg-azure-sky"
        role="progressbar"
        aria-label="Progress to the next tier"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div className="h-full rounded-full bg-azure-blue" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-2 flex justify-between gap-4 text-sm">
        <span className="text-gray-600 tabular-nums">{formatMoney(spend)} spent in the last 12 months</span>
        <span className="font-semibold text-azure-navy tabular-nums">
          {next ? `${formatMoney(next.min_qualifying_spend - spend)} more to ${tierLabel(next.tier_name)}` : "Top tier reached"}
        </span>
      </div>
    </section>
  );
}

function SignedOut() {
  return (
    <section className="rounded-card border border-t-4 border-gray-200 border-t-azure-blue bg-white p-6 shadow-card">
      <h2 className="text-2xl font-semibold text-azure-navy">See your points</h2>
      <p className="mt-2 text-gray-600">Log in to see your balance, your tier and the points from your recent trips.</p>
      <div className="mt-5 flex items-center gap-6">
        <Link
          href="/login"
          className="rounded-control bg-azure-blue px-6 py-3 text-sm font-semibold text-white hover:bg-azure-blue-dark"
        >
          Log in
        </Link>
        <Link href="/register" className="text-sm font-semibold text-azure-blue hover:text-azure-blue-dark hover:underline">
          Join for free
        </Link>
      </div>
    </section>
  );
}

function TierCards({ tiers, current }: { tiers: LoyaltyTier[]; current: LoyaltyTier | null }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold text-azure-navy">Tiers</h2>
      <div className="grid grid-cols-4 gap-3">
        {tiers.map((tier) => {
          const isCurrent = current?.tier_id === tier.tier_id;
          return (
            <div
              key={tier.tier_id}
              className={`rounded-card bg-white p-4 shadow-card ${isCurrent ? "border-2 border-azure-blue" : "border border-gray-200"}`}
            >
              <p className={`flex items-center justify-between font-semibold ${TIER_COLORS[tier.tier_name]}`}>
                {tierLabel(tier.tier_name)}
                {isCurrent && (
                  <span className="rounded-control bg-azure-sky px-2 py-0.5 text-[11px] font-semibold text-azure-blue">You</span>
                )}
              </p>
              <p className="text-xs text-gray-500">
                {tier.min_qualifying_spend === 0 ? "Everyone" : `${formatMoney(tier.min_qualifying_spend)}+ a year`}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-700">
                {tierPerks(tier).map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

async function Activity({ userId }: { userId: number }) {
  const rows = await getRecentActivity(userId);

  return (
    <section className="rounded-card border border-gray-200 bg-white p-6 shadow-card">
      <h2 className="text-xl font-semibold text-azure-navy">Recent activity</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-gray-600">No points yet. Book a flight to start earning.</p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100">
          {rows.map((row) => (
            <li key={row.transaction_id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <span>
                <span className="block font-semibold text-gray-900">{row.description ?? row.transaction_type}</span>
                <span className="block text-xs text-gray-500">
                  {formatDate(row.created_at)} · {tierLabel(row.transaction_type)}
                </span>
              </span>
              <span className={`font-semibold tabular-nums ${row.points < 0 ? "text-red-700" : "text-green-700"}`}>
                {row.points < 0 ? "−" : "+"}
                {Math.abs(row.points).toLocaleString("en-US")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
