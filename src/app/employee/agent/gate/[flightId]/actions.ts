"use server";

import { revalidatePath } from "next/cache";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getSignedInStaff } from "@/app/employee/admin/requireAdmin";
import { db } from "@/lib/db";
import { ASSIGNABLE_GATE_STATUS, BOARDING_FLIGHT_STATUSES, DEPARTED_FLIGHT_STATUSES } from "@/lib/gateRules";
import { GATE_AGENT } from "@/lib/roles";

// The Gate tile: gate statuses, giving a flight a gate, check-in and boarding.
// Gate Agents and System Administrators only. Rules: src/lib/gateRules.ts.

export type GateActionResult = { ok: true } | { ok: false; error: string };

const NOT_ALLOWED: GateActionResult = { ok: false, error: "Only Gate Agents and System Administrators can do this." };

// Which flight columns each gate uses, and whose gates it can be given.
const GATE_COLUMNS = {
  departure: { gate: "departure_gate_id", airport: "origin_airport_id" },
  arrival: { gate: "arrival_gate_id", airport: "destination_airport_id" },
} as const;

function refresh() {
  revalidatePath("/employee/agent");
  revalidatePath("/employee/admin");
}

// Sets the status of the flight's departure or arrival gate. Not once the flight has left.
// Setting OCCUPIED or MAINTENANCE makes the gate unusable; the tile then asks for a new one.
export async function setGateStatus(input: {
  flightId: number;
  which: "departure" | "arrival";
  status: string;
}): Promise<GateActionResult> {
  const employee = await getSignedInStaff([GATE_AGENT]);
  if (!employee) return NOT_ALLOWED;
  const columns = GATE_COLUMNS[input.which];
  if (!columns) return { ok: false, error: "Unknown gate." };

  const [flights] = await db.query<RowDataPacket[]>(
    `SELECT fs.flight_status_name FROM flight f
       JOIN flight_status fs ON fs.flight_status_id = f.flight_status_id
      WHERE f.flight_id = ?`,
    [input.flightId],
  );
  if (flights.length === 0) return { ok: false, error: "That flight no longer exists." };
  if (DEPARTED_FLIGHT_STATUSES.includes(flights[0].flight_status_name)) {
    return { ok: false, error: "This flight has already departed, so its gate statuses can't be changed." };
  }

  try {
    const [result] = await db.query<ResultSetHeader>(
      `UPDATE gate g JOIN flight f ON f.${columns.gate} = g.gate_id
          SET g.gate_status_id = (SELECT gate_status_id FROM gate_status WHERE gate_status_name = ?),
              g.updated_by = ?, g.last_updated = NOW()
        WHERE f.flight_id = ?`,
      [input.status, employee.user_id, input.flightId],
    );
    if (result.affectedRows === 0) return { ok: false, error: `This flight has no ${input.which} gate yet.` };
  } catch (error) {
    // NULL status id = a name that isn't in gate_status
    if ((error as { code?: string }).code === "ER_BAD_NULL_ERROR") return { ok: false, error: "Unknown gate status." };
    throw error;
  }
  refresh();
  return { ok: true };
}

// Gives the flight an AVAILABLE gate: departure at its origin airport, arrival at its destination.
// Used for a pending gate, and to move off a gate that's OCCUPIED or under MAINTENANCE.
export async function assignGate(input: {
  flightId: number;
  which: "departure" | "arrival";
  gateId: number;
}): Promise<GateActionResult> {
  const employee = await getSignedInStaff([GATE_AGENT]);
  if (!employee) return NOT_ALLOWED;
  const columns = GATE_COLUMNS[input.which];
  if (!columns) return { ok: false, error: "Unknown gate." };

  const [gates] = await db.query<RowDataPacket[]>(
    `SELECT g.gate_id
       FROM gate g
       JOIN terminal t     ON t.terminal_id = g.terminal_id
       JOIN gate_status gs ON gs.gate_status_id = g.gate_status_id
       JOIN flight f       ON f.${columns.airport} = t.airport_id
      WHERE g.gate_id = ? AND f.flight_id = ? AND gs.gate_status_name = ?`,
    [input.gateId, input.flightId, ASSIGNABLE_GATE_STATUS],
  );
  if (gates.length === 0) return { ok: false, error: "That gate isn't available at this airport any more." };

  await db.query(`UPDATE flight SET ${columns.gate} = ?, updated_by = ?, last_updated = NOW() WHERE flight_id = ?`, [
    input.gateId,
    employee.user_id,
    input.flightId,
  ]);
  refresh();
  return { ok: true };
}

// Not checked in -> Checked in.
export async function checkInPassenger(input: { eTicket: string }): Promise<GateActionResult> {
  return movePassenger(input.eTicket, "checked_in = 1", "(t.checked_in IS NULL OR t.checked_in = 0)", "already checked in");
}

// Checked in -> Boarded.
export async function boardPassenger(input: { eTicket: string }): Promise<GateActionResult> {
  return movePassenger(input.eTicket, "boarded = 1", "t.checked_in = 1 AND t.boarded = 0", "not checked in, or already boarded");
}

// One guarded UPDATE: only changes the ticket if it's at the right step and its flight hasn't left.
async function movePassenger(eTicket: string, set: string, step: string, wrongStep: string): Promise<GateActionResult> {
  const employee = await getSignedInStaff([GATE_AGENT]);
  if (!employee) return NOT_ALLOWED;

  const [result] = await db.query<ResultSetHeader>(
    `UPDATE ticket t
       JOIN flight f         ON f.flight_id = t.flight_id
       JOIN flight_status fs ON fs.flight_status_id = f.flight_status_id
        SET t.${set}, t.updated_by = ?, t.last_updated = NOW()
      WHERE t.e_ticket_number = ? AND ${step} AND fs.flight_status_name IN (?)`,
    [employee.user_id, eTicket, BOARDING_FLIGHT_STATUSES],
  );
  if (result.affectedRows !== 1) return { ok: false, error: `This passenger is ${wrongStep}, or the flight has left.` };
  refresh();
  return { ok: true };
}
