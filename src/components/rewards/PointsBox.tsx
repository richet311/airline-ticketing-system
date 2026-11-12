import Link from "next/link";

import { POINTS_PER_DOLLAR_OFF, pointsEarned } from "@/lib/rewardPoints";

export type CheckoutRewards = {
  points: number;
  tierName: string;
  bonusPercent: number;
  freeBags: number;
  priorityBoarding: boolean;
};

// Azure Rewards box in the checkout summary: balance, points used on upgrades, points this trip earns, tier perks
export function PointsBox({ rewards, total, pointsUsed }: { rewards: CheckoutRewards | null; total: number; pointsUsed: number }) {
  if (!rewards) {
    return (
      <div className="rounded-card border border-gray-200 bg-white p-5 text-sm shadow-card">
        <p className="text-[11px] font-semibold tracking-widest text-azure-blue uppercase">Azure Rewards</p>
        <p className="mt-1 text-gray-700">
          <Link href="/login" className="font-semibold text-azure-blue hover:underline">
            Log in
          </Link>{" "}
          to earn points on this trip.
        </p>
      </div>
    );
  }

  const perks = [];
  if (rewards.priorityBoarding) perks.push("Priority boarding included");
  if (rewards.freeBags > 0) perks.push("2nd checked bag free");

  return (
    <div className="rounded-card border border-gray-200 bg-white p-5 text-sm shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-widest text-azure-blue uppercase">Azure Rewards</p>
        <span className="text-xs font-semibold text-azure-navy">{rewards.tierName}</span>
      </div>
      <p className="mt-1 text-gray-700">
        You have <span className="font-semibold tabular-nums">{rewards.points.toLocaleString("en-US")}</span> points
        (worth ${(rewards.points / POINTS_PER_DOLLAR_OFF).toFixed(2)}).
      </p>
      {pointsUsed > 0 && (
        <p className="mt-1 text-gray-700">
          Using <span className="font-semibold tabular-nums">{pointsUsed.toLocaleString("en-US")}</span> points on upgrades.{" "}
          <span className="tabular-nums">{(rewards.points - pointsUsed).toLocaleString("en-US")}</span> left after.
        </p>
      )}
      <p className="mt-1 text-gray-700">
        This trip earns about{" "}
        <span className="font-semibold tabular-nums">{pointsEarned(total, rewards.bonusPercent).toLocaleString("en-US")}</span>{" "}
        points.
      </p>
      {perks.length > 0 && (
        <p className="mt-3 rounded-control bg-azure-sky px-3 py-2 text-xs text-azure-navy">
          {rewards.tierName} perks: {perks.join(" · ")}
        </p>
      )}
    </div>
  );
}
