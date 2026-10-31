import Link from "next/link";
import { Suspense } from "react";

import { ReportShell } from "@/components/reports/ReportShell";
import { REPORTS } from "@/lib/reports";

export default function ReportsPage() {
  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Loading...</p>}>
      <ReportShell>
        <ul className="grid grid-cols-3 gap-6">
          {Object.values(REPORTS).map((report) => (
            <li key={report.href}>
              <Link href={report.href} className="group block h-full rounded-card border border-gray-200 bg-white p-6">
                <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">{report.area}</p>
                <h2 className="mt-1 text-xl font-semibold text-azure-navy group-hover:underline">{report.title}</h2>
                <p className="mt-2 text-sm text-gray-600">{report.question}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-azure-blue">Open report →</span>
              </Link>
            </li>
          ))}
        </ul>
      </ReportShell>
    </Suspense>
  );
}
