import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { CustomersPreview, OperationsPreview, RevenuePreview } from "@/components/reports/ReportPreviews";
import { ReportShell } from "@/components/reports/ReportShell";
import { REPORTS } from "@/lib/reports";

const PREVIEWS: Record<keyof typeof REPORTS, { caption: string; chart: ReactNode }> = {
  revenue: { caption: "Top routes · revenue per 100 mi", chart: <RevenuePreview /> },
  operations: { caption: "Flights by status", chart: <OperationsPreview /> },
  customers: { caption: "Top customers · spend", chart: <CustomersPreview /> },
};

export default function ReportsPage() {
  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Loading...</p>}>
      <ReportShell>
        <ul className="space-y-5">
          {(Object.keys(REPORTS) as (keyof typeof REPORTS)[]).map((key) => {
            const report = REPORTS[key];
            return (
              <li key={report.href} className="grid grid-cols-[1fr_22.5rem] gap-4">
                <Link href={report.href} className="group block rounded-card border border-gray-200 bg-white p-6">
                  <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">{report.area}</p>
                  <h2 className="mt-1 text-xl font-semibold text-azure-navy group-hover:underline">{report.title}</h2>
                  <p className="mt-2 text-sm text-gray-600">{report.question}</p>
                  <span className="mt-4 inline-block text-sm font-semibold text-azure-blue">Open report →</span>
                </Link>
                <div className="rounded-card border border-gray-200 bg-white px-5 py-4">
                  <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">Preview</p>
                  <p className="mt-0.5 mb-2.5 text-xs text-gray-600">{PREVIEWS[key].caption}</p>
                  {PREVIEWS[key].chart}
                </div>
              </li>
            );
          })}
        </ul>
      </ReportShell>
    </Suspense>
  );
}
