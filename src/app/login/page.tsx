import Link from "next/link";

import { SiteHeader } from "@/components/SiteHeader";
import { CustomerLoginForm } from "@/components/auth/CustomerLoginForm";

const linkClass = "font-semibold text-azure-blue hover:text-azure-blue-dark hover:underline";

export default function LoginPage() {
  return (
    <>
      <SiteHeader minimal />

      <main className="flex-1 bg-azure-page">
        <div className="mx-auto max-w-md px-4 py-14">
          <section aria-labelledby="login-heading" className="rounded-card border border-gray-200 bg-white p-10">
            <h1 id="login-heading" className="mb-8 text-3xl font-semibold text-azure-navy">
              Log in to Azure Air
            </h1>

            <CustomerLoginForm />

            <div className="mt-8 space-y-2 border-t border-gray-200 pt-5 text-center text-sm text-gray-700">
              <p>
                New to Azure Air?{" "}
                <Link href="/register" className={linkClass}>
                  Create an account
                </Link>
              </p>
              <p>
                Azure Air employee?{" "}
                <Link href="/login/employee" className={linkClass}>
                  Employee portal
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
