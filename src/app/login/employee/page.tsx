import Link from "next/link";

import { SiteHeader } from "@/components/SiteHeader";
import { StaffSignInForm } from "@/components/auth/StaffSignInForm";

export default function EmployeeLoginPage() {
  return (
    <>
      <SiteHeader minimal />

      <main className="flex-1 bg-azure-page">
        <div className="mx-auto max-w-md px-4 py-14">
          <section
            aria-labelledby="staff-heading"
            className="rounded-card bg-azure-navy p-10 text-white"
          >
            <p className="text-[11px] font-semibold tracking-widest text-sky-300 uppercase">Employee portal</p>
            <h1 id="staff-heading" className="mt-1 mb-8 text-3xl font-semibold">
              Staff sign in
            </h1>

            <StaffSignInForm />

            <div className="mt-8 border-t border-white/20 pt-5 text-sm text-white/80">
              <p>One sign-in for all staff. You&apos;re sent to your dashboard based on your role:</p>
              <ul className="mt-3 space-y-2">
                <li className="rounded-control border border-white/30 px-3 py-2 text-white">
                  <span className="font-semibold">Agent</span> → bookings, refunds, gate &amp; boarding
                </li>
                <li className="rounded-control border border-white/30 px-3 py-2 text-white">
                  <span className="font-semibold">Admin</span> → flights, fleet, staff, reports
                </li>
              </ul>
              <p className="mt-4">Authorized personnel only.</p>
            </div>
          </section>

          <p className="mt-6 text-center text-sm text-gray-700">
            Not an employee?{" "}
            <Link href="/login" className="font-semibold text-azure-blue hover:text-azure-blue-dark hover:underline">
              Customer log in
            </Link>
          </p>
          <p className="mt-4 text-center text-xs text-gray-500">© Azure Air</p>
        </div>
      </main>
    </>
  );
}
