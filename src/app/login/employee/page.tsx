import Link from "next/link";

import { SiteHeader } from "@/components/SiteHeader";
import { StaffSignInForm } from "@/components/auth/StaffSignInForm";

export default function EmployeeLoginPage() {
  return (
    <>
      <SiteHeader minimal />

      <main className="flex-1 bg-azure-page">
        <div className="mx-auto max-w-md px-4 py-14">
          <section aria-labelledby="staff-heading" className="rounded-card bg-azure-navy p-10 text-white">
            <h1 id="staff-heading" className="mb-8 text-3xl font-semibold">
              Staff sign in
            </h1>

            <StaffSignInForm />

            <p className="mt-8 border-t border-white/20 pt-5 text-center text-sm text-white/80">
              Not an employee?{" "}
              <Link href="/login" className="font-semibold text-sky-300 hover:underline">
                Customer log in
              </Link>
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
