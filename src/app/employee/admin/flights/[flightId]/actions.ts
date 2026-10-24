"use server";

import { revalidatePath } from "next/cache";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { db } from "@/lib/db";
import { ASSIGNABLE_GATE_STATUS, gateRequired, missingGateMessage } from "@/lib/gateRules";
import { OPERATIONS_MANAGER } from "@/lib/roles";

import { getSignedInStaff } from "../../requireAdmin";

//This is for scheduled flights tile in employee view. Updates are reflected in real time. Only visible to admin and manager
export type FlightUpdateResult = { ok: true } | { ok: false; error: string };

const GATE_COLUMNS = {
  departure: { gate: "departure_gate_id", airport: "origin_airport_id" },
  arrival: { gate: "arrival_gate_id", airport: "destination_airport_id" },
} as const;

// gate logic
export async function updateFlightGate(input: {
  flightId: number;
  which: "departure" | "arrival";
  gateId: number | null;
}): Promise<FlightUpdateResult> {
  const employee = await getSignedInStaff([OPERATIONS_MANAGER]);
  if (!employee) return { ok: false, error: "Only Operations Managers and System Administrators can change gates." };

  const columns = GATE_COLUMNS[input.which];
  if (!columns) return { ok: false, error: "Unknown gate." };

  const [flights] = await db.query<RowDataPacket[]>(
    `SELECT f.${columns.gate} AS current_gate_id, fs.flight_status_name
       FROM flight f
       JOIN flight_status fs ON fs.flight_status_id = f.flight_status_id
      WHERE f.flight_id = ?`,
    [input.flightId],
  );
  if (flights.length === 0) return { ok: false, error: "That flight no longer exists." };
  const { current_gate_id: currentGateId, flight_status_name: status } = flights[0];

  if (input.gateId === null) {
    if (gateRequired(input.which, status)) {
      return { ok: false, error: `${status} flight. Cannot modify ${input.which} gate.` };
    }
  } else if (input.gateId !== currentGateId) {
    const [gates] = await db.query<RowDataPacket[]>(
      `SELECT g.gate_number, gs.gate_status_name
         FROM gate g
         JOIN terminal t     ON t.terminal_id = g.terminal_id
         JOIN gate_status gs ON gs.gate_status_id = g.gate_status_id
         JOIN flight f       ON f.${columns.airport} = t.airport_id
        WHERE g.gate_id = ? AND f.flight_id = ?`,
      [input.gateId, input.flightId],
    );
    if (gates.length === 0) return { ok: false, error: "That gate isn't at this flight's airport." };
    if (gates[0].gate_status_name !== ASSIGNABLE_GATE_STATUS) {
      return { ok: false, error: `Gate ${gates[0].gate_number} is ${gates[0].gate_status_name.toLowerCase()}.` };
    }
  }

  await db.query(`UPDATE flight SET ${columns.gate} = ?, updated_by = ?, last_updated = NOW() WHERE flight_id = ?`, [
    input.gateId,
    employee.user_id,
    input.flightId,
  ]);

  revalidatePath("/employee/admin");
  return { ok: true };
}

export async function updateFlightStatus(input: { flightId: number; status: string }): Promise<FlightUpdateResult> {
  const employee = await getSignedInStaff([OPERATIONS_MANAGER]);
  if (!employee) return { ok: false, error: "Only Operations Managers and System Administrators can change statuses." };

  const [flights] = await db.query<RowDataPacket[]>(
    "SELECT departure_gate_id, arrival_gate_id FROM flight WHERE flight_id = ?",
    [input.flightId],
  );
  if (flights.length === 0) return { ok: false, error: "That flight no longer exists." };
  const missing = missingGateMessage(input.status, flights[0].departure_gate_id !== null, flights[0].arrival_gate_id !== null);
  if (missing) return { ok: false, error: missing };

  try {
    const [result] = await db.query<ResultSetHeader>(
      `UPDATE flight
       SET flight_status_id = (SELECT flight_status_id FROM flight_status WHERE flight_status_name = ?), updated_by = ?, last_updated = NOW()
       WHERE flight_id = ?`,
      [input.status, employee.user_id, input.flightId],
    );
    if (result.affectedRows !== 1) return { ok: false, error: "That flight no longer exists." };
  } catch (error) {
    if ((error as { code?: string }).code === "ER_BAD_NULL_ERROR") return { ok: false, error: "Unknown status." };
    throw error;
  }

  revalidatePath("/employee/admin");
  return { ok: true };
}
