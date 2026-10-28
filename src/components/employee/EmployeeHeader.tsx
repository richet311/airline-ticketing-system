import Link from "next/link";

import { signOut } from "@/app/employee/actions";
import { canUse, employeeHome, OPERATIONS_MANAGER, REPORTS_PAGE } from "@/lib/roles";
import type { SignedInEmployee } from "@/lib/types";

export function EmployeeHeader({ employee }: { employee: SignedInEmployee }) {
  return (
    <header className="bg-azure-navy text-white">
      <div className="mx-auto flex h-17 max-w-6xl items-center gap-4 px-4">
        <Link href={employeeHome(employee.job_role_name)} className="text-lg font-semibold tracking-[0.18em]">
          AZURE AIR
        </Link>
        <span className="border-l border-white/30 pl-4 text-sm text-white/80">Employee Portal</span>

        <div className="ml-auto flex items-center gap-4 text-sm">
          <span>
            {employee.first_name} {employee.last_name} · <span className="text-white/70">{employee.job_role_name}</span>
          </span>
          {canUse(employee.job_role_name, [OPERATIONS_MANAGER]) && (
            <Link href={REPORTS_PAGE} className="rounded-control bg-azure-blue px-3 py-1.5 font-semibold hover:bg-azure-blue-dark">
              Reports
            </Link>
          )}
          <form action={signOut}>
            <button type="submit" className="font-semibold underline underline-offset-4 hover:text-white/80">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
