import type { RowDataPacket } from "mysql2";

import { AdminTable, AdminTile } from "@/components/admin/AdminTile";
import { pageNumber, TilePager } from "@/components/admin/TilePager";
import { db } from "@/lib/db";
import { ASSIGNABLE_GATE_STATUS } from "@/lib/gateRules";
import type { UnavailableGateRow } from "@/lib/types";

import { MarkGateAvailableButton } from "./MarkGateAvailableButton";

type SearchParams = { [key: string]: string | string[] | undefined };

const PAGE_SIZE = 10;

// Gates set to OCCUPIED or MAINTENANCE. Marking one available puts it back in the Boarding tile's gate lists.
export async function UnavailableGatesTile({ params, basePath }: { params: SearchParams; basePath: string }) {
  const [[counted]] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
       FROM gate g
       JOIN gate_status gs ON gs.gate_status_id = g.gate_status_id
      WHERE gs.gate_status_name <> ?`,
    [ASSIGNABLE_GATE_STATUS],
  );
  const total = Number(counted.total);
  const page = pageNumber(params, "gates_page", total, PAGE_SIZE);
  const [gates] = await db.query<UnavailableGateRow[]>(
    `SELECT g.gate_id, a.airport_code, a.city, t.terminal_name, g.gate_number, gs.gate_status_name
       FROM gate g
       JOIN gate_status gs ON gs.gate_status_id = g.gate_status_id
       JOIN terminal t     ON t.terminal_id = g.terminal_id
       JOIN airport a      ON a.airport_id = t.airport_id
      WHERE gs.gate_status_name <> ?
      ORDER BY a.airport_code, t.terminal_name, g.gate_number
      LIMIT ? OFFSET ?`,
    [ASSIGNABLE_GATE_STATUS, PAGE_SIZE, (page - 1) * PAGE_SIZE],
  );

  return (
    <AdminTile overline="Gate" title="Unavailable gates">
      <p className="text-sm text-gray-600">
        Gates that are occupied or under maintenance can&apos;t be picked in Boarding. Mark a gate available once it&apos;s
        free again.
      </p>
      {total === 0 ? (
        <p className="mt-4 text-sm text-gray-600">Every gate is available.</p>
      ) : (
        <>
          <AdminTable headings={["Airport", "Gate", "Status", ""]}>
            {gates.map((gate) => (
              <tr key={gate.gate_id}>
                <td className="py-2 pr-4">
                  <span className="font-semibold text-gray-900">{gate.airport_code}</span> · {gate.city}
                </td>
                <td className="py-2 pr-4">
                  {gate.terminal_name} · {gate.gate_number}
                </td>
                <td className="py-2 pr-4 text-amber-700">{gate.gate_status_name}</td>
                <td className="py-2 pr-4 text-right">
                  <MarkGateAvailableButton gateId={gate.gate_id} label={`${gate.airport_code} ${gate.gate_number}`} />
                </td>
              </tr>
            ))}
          </AdminTable>
          <TilePager basePath={basePath} params={params} name="gates_page" page={page} size={PAGE_SIZE} total={total} noun="Gates" />
        </>
      )}
    </AdminTile>
  );
}
