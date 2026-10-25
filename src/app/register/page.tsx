import Link from "next/link";

import { SiteHeader } from "@/components/SiteHeader";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <>
      <SiteHeader minimal />

      <main className="flex-1 bg-azure-page">
        <div className="mx-auto max-w-xl px-4 py-14">
          <section aria-labelledby="register-heading" className="rounded-card border border-gray-200 bg-white p-10">
            <h1 id="register-heading" className="mb-8 text-3xl font-semibold text-azure-navy">
              Create your account
            </h1>

            <RegisterForm />

            <p className="mt-8 border-t border-gray-200 pt-5 text-center text-sm text-gray-700">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-azure-blue hover:text-azure-blue-dark hover:underline">
                Log in
              </Link>
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
