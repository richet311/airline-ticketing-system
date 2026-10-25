import Link from "next/link";

import { DawnCrest } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";
import { CustomerLoginForm } from "@/components/auth/CustomerLoginForm";
import { ArrowRightIcon } from "@/components/icons";

export default function LoginPage() {
  return (
    <>
      <SiteHeader minimal />

      <main className="flex-1 bg-azure-page">
        <div className="mx-auto max-w-md px-4 py-14">
          <DawnCrest className="mx-auto mb-8 h-28 w-auto" />
          <section
            aria-labelledby="login-heading"
            className="rounded-card border border-t-4 border-gray-200 border-t-azure-blue bg-white p-10 shadow-card"
          >
            <h1 id="login-heading" className="mb-8 text-3xl font-semibold text-azure-navy">
              Log in to Azure Air
            </h1>

            <CustomerLoginForm />

            <p className="mt-8 text-center text-sm text-gray-600">New to Azure Air?</p>
            <Link
              href="/register"
              className="mt-3 flex h-11 w-full items-center justify-center rounded-control border border-azure-navy text-sm font-semibold tracking-wide text-azure-navy hover:bg-azure-sky"
            >
              Create an account
            </Link>

            <Link
              href="/login/employee"
              className="group mt-8 flex items-center justify-between gap-4 border-t border-gray-200 pt-5"
            >
              <span>
                <span className="block text-sm font-semibold text-azure-navy">Azure Air employee?</span>
                <span className="block text-sm text-gray-600">Agents and admins sign in on the employee portal.</span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-azure-blue group-hover:underline">
                Employee portal
                <ArrowRightIcon className="h-4 w-4" />
              </span>
            </Link>
          </section>

          <p className="mt-6 text-center text-sm text-gray-600">
            No account needed to search flights, or to look up a trip with your confirmation code and last name.
          </p>
          <p className="mt-4 text-center text-xs text-gray-500">© Azure Air</p>
        </div>
      </main>
    </>
  );
}
