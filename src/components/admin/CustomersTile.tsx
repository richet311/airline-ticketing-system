import type { RowDataPacket } from "mysql2";
import Form from "next/form";
import Link from "next/link";

import { AdminTable, AdminTile, adminButtonClass, adminInputClass, adminLabelClass } from "@/components/admin/AdminTile";
import { pageNumber, TilePager } from "@/components/admin/TilePager";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import type { CustomerListRow } from "@/lib/types";

type SearchParams = { [key: string]: string | string[] | undefined };

const PAGE_SIZE = 20;
const PAGE_NAME = "customers_page";
const FIELDS = ["customer_first", "customer_last", "customer_born_after", "customer_nationality"] as const;
const cell = "py-2 pr-4";

function urlValue(params: SearchParams, name: string): string {
  const value = params[name];
  return (Array.isArray(value) ? value[0] : (value ?? "")).trim();
}

export async function CustomersTile({ params, basePath }: { params: SearchParams; basePath: string }) {
  const first = urlValue(params, "customer_first");
  const last = urlValue(params, "customer_last");
  const bornAfter = /^\d{4}-\d{2}-\d{2}$/.test(urlValue(params, "customer_born_after")) ? urlValue(params, "customer_born_after") : "";
  const nationality = urlValue(params, "customer_nationality").toUpperCase();

  const where = ["p.user_id IS NOT NULL"];
  const values: string[] = [];
  if (first) {
    where.push("p.first_name LIKE ?");
    values.push(`%${first}%`);
  }
  if (last) {
    where.push("p.last_name LIKE ?");
    values.push(`%${last}%`);
  }
  if (bornAfter) {
    where.push("p.date_of_birth > ?");
    values.push(bornAfter);
  }
  if (nationality) {
    where.push("p.nationality = ?");
    values.push(nationality);
  }
  const whereSql = `WHERE ${where.join(" AND ")}`;

  const [nationalities] = await db.query<RowDataPacket[]>(
    "SELECT DISTINCT nationality FROM passenger WHERE user_id IS NOT NULL AND nationality IS NOT NULL ORDER BY nationality",
  );
  const [[counted]] = await db.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM passenger p ${whereSql}`, values);
  const total = Number(counted.total);
  const page = pageNumber(params, PAGE_NAME, total, PAGE_SIZE);
  const [customers] = await db.query<CustomerListRow[]>(
    `SELECT p.passenger_id, p.user_id, p.first_name, p.last_name, u.email, p.date_of_birth, p.nationality, p.created_at
       FROM passenger p
       LEFT JOIN user u ON u.user_id = p.user_id
      ${whereSql}
      ORDER BY p.created_at DESC, p.passenger_id DESC
      LIMIT ? OFFSET ?`,
    [...values, PAGE_SIZE, (page - 1) * PAGE_SIZE],
  );

  const others = Object.entries(params)
    .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value] as const)
    .filter((entry): entry is readonly [string, string] => !!entry[1] && entry[0] !== PAGE_NAME && !(FIELDS as readonly string[]).includes(entry[0]));
  const clearHref = others.length > 0 ? `${basePath}?${new URLSearchParams(others.map(([key, value]) => [key, value]))}` : basePath;

  return (
    <AdminTile overline="Customers" title="All Customers">
      <Form
        key={JSON.stringify([first, last, bornAfter, nationality])}
        action={basePath}
        scroll={false}
        className="mb-2 flex flex-wrap items-end gap-3"
      >
        {others.map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <label className="w-40">
          <span className={adminLabelClass}>First name</span>
          <input name="customer_first" defaultValue={first} maxLength={50} className={adminInputClass} />
        </label>
        <label className="w-40">
          <span className={adminLabelClass}>Last name</span>
          <input name="customer_last" defaultValue={last} maxLength={50} className={adminInputClass} />
        </label>
        <label className="w-40">
          <span className={adminLabelClass}>Born after</span>
          <input name="customer_born_after" type="date" defaultValue={bornAfter} className={adminInputClass} />
        </label>
        <label className="w-40">
          <span className={adminLabelClass}>Nationality</span>
          <select name="customer_nationality" defaultValue={nationality} className={adminInputClass}>
            <option value="">Any</option>
            {nationalities.map((row) => (
              <option key={row.nationality} value={row.nationality}>
                {row.nationality}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={adminButtonClass}>
          Apply
        </button>
        <Link href={clearHref} scroll={false} className="flex h-9 items-center text-sm font-semibold text-azure-blue hover:underline">
          Clear
        </Link>
      </Form>

      {total === 0 ? (
        <p className="mt-3 text-sm text-gray-600">No customers match these filters.</p>
      ) : (
        <>
          <AdminTable headings={["Passenger ID", "User ID", "Name", "Email", "Date of birth", "Nationality", "Created (UTC)"]}>
            {customers.map((customer) => (
              <tr key={customer.passenger_id}>
                <td className={cell}>{customer.passenger_id}</td>
                <td className={cell}>{customer.user_id ?? "—"}</td>
                <td className={`${cell} font-semibold`}>
                  {`${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || "—"}
                </td>
                <td className={cell}>{customer.email}</td>
                <td className={cell}>{customer.date_of_birth ? formatDate(customer.date_of_birth) : "—"}</td>
                <td className={cell}>{customer.nationality ?? "—"}</td>
                <td className={cell}>{formatDate(customer.created_at)}</td>
              </tr>
            ))}
          </AdminTable>
          <TilePager basePath={basePath} params={params} name={PAGE_NAME} page={page} size={PAGE_SIZE} total={total} noun="Customers" />
        </>
      )}
    </AdminTile>
  );
}
