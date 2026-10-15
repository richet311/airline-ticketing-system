import Link from "next/link";

// The navy Azure Rewards banner near the bottom of Home, inviting guests to sign up.
// No props, and nothing comes from the database. (A customer's points balance,
// user.loyalty_points, belongs in the header once they are logged in.)

export function RewardsBanner() {
  return (
    <section className="flex flex-col gap-4 rounded-lg bg-azure-navy p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div>
        <p className="text-[11px] font-semibold tracking-wider text-sky-300 uppercase">Azure Rewards</p>
        <h2 className="mt-1 text-xl font-bold">Earn points on every flight.</h2>
        <p className="mt-1 max-w-xl text-sm text-white/75">
          Create a free account to save travelers, manage trips in one place, and collect loyalty points you can use
          on future bookings.
        </p>
      </div>
      <Link
        href="/register"
        className="shrink-0 self-start rounded bg-white px-5 py-2.5 text-sm font-semibold text-azure-navy hover:bg-gray-100 sm:self-auto"
      >
        Join for free
      </Link>
    </section>
  );
}
