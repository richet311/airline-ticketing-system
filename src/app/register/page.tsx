import Link from "next/link";

import { SiteHeader } from "@/components/SiteHeader";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <>
      <SiteHeader minimal />

      <main className="flex-1 bg-azure-page">
        <div className="mx-auto max-w-xl px-4 py-14">
          <section
            aria-labelledby="register-heading"
            className="rounded-card border border-t-4 border-gray-200 border-t-azure-blue bg-white p-10 shadow-card"
          >
            <p className="text-[11px] font-semibold tracking-widest text-azure-blue uppercase">Azure Rewards</p>
            <h1 id="register-heading" className="mt-1 text-3xl font-semibold text-azure-navy">
              Create your account
            </h1>
            <p className="mt-2 mb-8 text-[15px] leading-relaxed text-gray-600">
              Join for free to save travelers, manage trips in one place, and collect loyalty points you can use on future
              bookings.
            </p>

            <RegisterForm />

            <p className="mt-8 border-t border-gray-200 pt-5 text-center text-sm text-gray-700">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-azure-blue hover:text-azure-blue-dark hover:underline">
                Log in
              </Link>
            </p>
          </section>

          <p className="mt-6 text-center text-xs text-gray-500">© Azure Air</p>
        </div>
      </main>
    </>
  );
}
