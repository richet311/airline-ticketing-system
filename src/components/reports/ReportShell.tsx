import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";

import { EmployeeHeader } from "@/components/employee/EmployeeHeader";
import { type Report, REPORTS_PAGE } from "@/lib/reports";
import { canUse, OPERATIONS_MANAGER } from "@/lib/roles";
import { getSignedInEmployee } from "@/lib/session";

export async function ReportShell({ report, children }: { report?: Report; children: ReactNode }) {
  await connection();
  const employee = await getSignedInEmployee();
  if (!employee) redirect("/login/employee");
  const allowed = canUse(employee.job_role_name, [OPERATIONS_MANAGER]);

  return (
    <>
      <EmployeeHeader employee={employee} />
      <main className="flex-1 bg-azure-page">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
          <div>
            {report && (
              <Link href={REPORTS_PAGE} className="text-sm font-semibold text-azure-blue hover:underline">
                ← All reports
              </Link>
            )}
            <h1 className="mt-1 text-3xl font-semibold text-azure-navy">{report?.title ?? "Reports"}</h1>
            {report && <p className="mt-2 text-gray-600">{report.question}</p>}
          </div>
          {allowed ? (
            children
          ) : (
            <p className="rounded-card border border-gray-200 bg-white p-6 text-gray-600">
              Reports are only available to System Administrators and Operations Managers.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
