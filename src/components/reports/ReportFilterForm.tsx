import Form from "next/form";
import Link from "next/link";

import { adminButtonClass, adminInputClass, adminLabelClass } from "@/components/admin/AdminTile";
import type { ReportFilters } from "@/lib/reports";

type Option = { value: string; label: string };

export function ReportFilterForm({
  action,
  filters,
  routes,
  cabins,
  tiers,
  minTickets,
}: {
  action: string;
  filters: ReportFilters;
  routes?: Option[];
  cabins?: Option[];
  tiers?: Option[];
  minTickets?: number;
}) {
  return (
    <section className="rounded-card border border-gray-200 bg-white p-5">
      <Form
        key={JSON.stringify({ ...filters, minTickets })}
        action={action}
        scroll={false}
        className="flex flex-wrap items-end gap-3"
      >
        <label className="w-40">
          <span className={adminLabelClass}>From</span>
          <input name="from" type="date" defaultValue={filters.from} className={adminInputClass} />
        </label>
        <label className="w-40">
          <span className={adminLabelClass}>To</span>
          <input name="to" type="date" defaultValue={filters.to} className={adminInputClass} />
        </label>
        {routes && <Choice name="route" label="Route" value={filters.route} options={routes} allLabel="All routes" />}
        {cabins && <Choice name="cabin" label="Cabin" value={filters.cabin} options={cabins} allLabel="All cabins" />}
        {tiers && <Choice name="tier" label="Rewards tier" value={filters.tier} options={tiers} allLabel="All tiers" />}
        {minTickets !== undefined && (
          <label className="w-32">
            <span className={adminLabelClass}>Min. tickets</span>
            <input name="min_tickets" type="number" min={1} defaultValue={minTickets} className={adminInputClass} />
          </label>
        )}
        <button type="submit" className={adminButtonClass}>
          Apply
        </button>
        <Link href={action} scroll={false} className="flex h-9 items-center text-sm font-semibold text-azure-blue hover:underline">
          Clear
        </Link>
      </Form>
    </section>
  );
}

function Choice({ name, label, value, options, allLabel }: { name: string; label: string; value: string; options: Option[]; allLabel: string }) {
  return (
    <label className="w-44">
      <span className={adminLabelClass}>{label}</span>
      <select name={name} defaultValue={value} className={adminInputClass}>
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
