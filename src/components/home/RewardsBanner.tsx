import Link from "next/link";

import { PageHeading } from "@/components/PageHeading";
import { ArrowRightIcon } from "@/components/icons";

export function RewardsBanner() {
  return (
    <section aria-labelledby="rewards-heading">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <PageHeading as="h2" id="rewards-heading" title="Azure Rewards">
          Earn points when you fly and use them on future trips.
        </PageHeading>
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
