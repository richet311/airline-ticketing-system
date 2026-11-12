import Form from "next/form";
import Link from "next/link";

import { adminButtonClass, adminInputClass, adminLabelClass } from "@/components/admin/AdminTile";
import { DETAIL_PREFIX, readDetailFilter } from "@/lib/reports";

type SearchParams = { [key: string]: string | string[] | undefined };
type Option = { value: string; label: string };
export type DetailChoice = { name: string; label: string; options: Option[]; allLabel: string };

// Search and dropdowns for a report's detail table. They only narrow that table: the summary's own filters
// and page are carried along unchanged, and the detail table starts again at its first page.
export function DetailFilterForm({
  action,
  params,
  searchPlaceholder,
  choices,
  matched,
  total,
  noun,
}: {
  action: string;
  params: SearchParams;
  searchPlaceholder: string;
  choices: DetailChoice[];
  matched: number;
  total: number;
  noun: string;
}) {
  const kept = Object.entries(params).flatMap(([key, value]) => {
    const text = Array.isArray(value) ? value[0] : value;
    return text && !key.startsWith(DETAIL_PREFIX) ? [[key, text]] : [];
  });
  const clearHref = kept.length > 0 ? `${action}?${new URLSearchParams(kept)}` : action;
  const active = readDetailFilter(params, "search") !== "" || choices.some((choice) => readDetailFilter(params, choice.name) !== "");

  return (
    <div className="mb-4">
      <Form key={JSON.stringify(params)} action={action} scroll={false} className="flex flex-wrap items-end gap-3">
        {kept.map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <label className="w-64">
          <span className={adminLabelClass}>Search</span>
          <input
            name={`${DETAIL_PREFIX}search`}
            type="search"
            defaultValue={readDetailFilter(params, "search")}
            placeholder={searchPlaceholder}
            className={adminInputClass}
          />
        </label>
        {choices.map((choice) => (
          <label key={choice.name} className="w-40">
            <span className={adminLabelClass}>{choice.label}</span>
            <select name={DETAIL_PREFIX + choice.name} defaultValue={readDetailFilter(params, choice.name)} className={adminInputClass}>
              <option value="">{choice.allLabel}</option>
              {choice.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button type="submit" className={adminButtonClass}>
          Filter
        </button>
        {active && (
          <Link href={clearHref} scroll={false} className="flex h-9 items-center text-sm font-semibold text-azure-blue hover:underline">
            Clear
          </Link>
        )}
      </Form>
      {active && (
        <p className="mt-3 text-sm text-gray-600">
          {matched} of {total} {noun} match.
        </p>
      )}
    </div>
  );
}
