import type { ReactNode } from "react";

export const adminInputClass =
  "h-9 w-full min-w-0 rounded-control border border-gray-300 bg-white px-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-azure-blue focus:ring-1 focus:ring-azure-blue focus:outline-none disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500";

export const adminButtonClass =
  "h-9 rounded-control bg-azure-blue px-5 text-sm font-semibold text-white hover:bg-azure-blue-dark disabled:opacity-60";

export const adminLabelClass = "mb-1 block text-[11px] font-semibold tracking-wider text-gray-500 uppercase";

export function AdminTile({ overline, title, children }: { overline: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-gray-200 bg-white p-6">
      <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">{overline}</p>
      <h2 className="mb-4 text-xl font-semibold text-azure-navy">{title}</h2>
      {children}
    </section>
  );
}

export function AdminTable({ headings, children }: { headings: string[]; children: ReactNode }) {
  return (
    <table className="mt-5 w-full text-left text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-[11px] tracking-wider text-gray-500 uppercase">
          {headings.map((heading) => (
            <th key={heading} className="py-2 pr-4 font-semibold">
              {heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 text-gray-800">{children}</tbody>
    </table>
  );
}

// this will add some flair to error notifications for users
export function FormError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-2 text-sm text-red-700">
      {message}
    </p>
  );
}
