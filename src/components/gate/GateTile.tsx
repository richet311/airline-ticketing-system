import type { RowDataPacket } from "mysql2";
import Form from "next/form";

import { AdminTile, adminButtonClass, adminInputClass, adminLabelClass } from "@/components/admin/AdminTile";
import { db } from "@/lib/db";
import type { GateFlightRow, GatePassengerRow, GateStatus } from "@/lib/types";

import { GateBoard } from "./GateBoard";

export function gateFlightFromUrl(params: { [key: string]: string | string[] | undefined }): string {
  const value = params.gate_flight;
  return (Array.isArray(value) ? value[0] : (value ?? "")).trim().toUpperCase().replace(/\s/g, "");
}

export async function GateTile({ flightNumber, basePath }: { flightNumber: string; basePath: string }) {
  return (
    <AdminTile overline="Gate" title="Boarding">
      <Form action={basePath} className="flex max-w-md items-end gap-2">
        <label className="flex-1">
          <span className={adminLabelClass}>Flight number</span>
          <input
            name="gate_flight"
            defaultValue={flightNumber}
            placeholder="AZ640"
            required
            className={`${adminInputClass} uppercase`}
          />
        </label>
        <button type="submit" className={adminButtonClass}>
          Find flight
        </button>
      </Form>

      {flightNumber !== "" && <GateFlight flightNumber={flightNumber} />}
    </AdminTile>
  );
}

// Loads the flight, its gates, the gates it could move to, and its passengers.
async function GateFlight({ flightNumber }: { flightNumber: string }) {
  const [flights] = await db.query<GateFlightRow[]>(
    `SELECT f.flight_id, f.flight_number, o.airport_code AS origin, d.airport_code AS destination,
            f.origin_airport_id, f.destination_airport_id, f.departure_time, o.timezone AS origin_timezone,
            fs.flight_status_name,
            f.departure_gate_id, CONCAT(dep_t.terminal_name, ' · ', dep_g.gate_number) AS departure_gate,
            dep_s.gate_status_name AS departure_gate_status,
            f.arrival_gate_id, CONCAT(arr_t.terminal_name, ' · ', arr_g.gate_number) AS arrival_gate,
            arr_s.gate_status_name AS arrival_gate_status
       FROM flight f
       JOIN airport o              ON o.airport_id = f.origin_airport_id
       JOIN airport d              ON d.airport_id = f.destination_airport_id
       JOIN flight_status fs       ON fs.flight_status_id = f.flight_status_id
       LEFT JOIN gate dep_g        ON dep_g.gate_id = f.departure_gate_id
       LEFT JOIN terminal dep_t    ON dep_t.terminal_id = dep_g.terminal_id
       LEFT JOIN gate_status dep_s ON dep_s.gate_status_id = dep_g.gate_status_id
       LEFT JOIN gate arr_g        ON arr_g.gate_id = f.arrival_gate_id
       LEFT JOIN terminal arr_t    ON arr_t.terminal_id = arr_g.terminal_id
       LEFT JOIN gate_status arr_s ON arr_s.gate_status_id = arr_g.gate_status_id
      WHERE f.flight_number = ? AND fs.flight_status_name <> 'ARRIVED' AND f.arrival_time > NOW()
      ORDER BY f.departure_time
      LIMIT 1`,
    [flightNumber],
  );
  if (flights.length === 0) {
    return <p className="mt-4 text-sm text-gray-600">No flight {flightNumber} that has yet to arrive.</p>;
  }
  const flight = flights[0];

  const [statuses] = await db.query<GateStatus[]>("SELECT * FROM gate_status ORDER BY gate_status_id");
  //AVAILABLE gates at the origin and destination airports: for pending gates, and for moving
  //the flight off a departure gate passengers can't board at
  const [gates] = await db.query<RowDataPacket[]>(
    `SELECT g.gate_id, t.airport_id, CONCAT(t.terminal_name, ' · ', g.gate_number) AS label
       FROM gate g
       JOIN terminal t     ON t.terminal_id = g.terminal_id
       JOIN gate_status gs ON gs.gate_status_id = g.gate_status_id
      WHERE t.airport_id IN (?, ?) AND gs.gate_status_name = 'AVAILABLE'
      ORDER BY t.terminal_name, g.gate_number`,
    [flight.origin_airport_id, flight.destination_airport_id],
  );
  const gatesAt = (airportId: number) =>
    gates
      .filter((gate) => gate.airport_id === airportId)
      .map((gate) => ({ gate_id: gate.gate_id as number, label: gate.label as string }));
  //shows everyone on a confirmed booking where the front of the plane is first
  const [passengers] = await db.query<GatePassengerRow[]>(
    `SELECT t.e_ticket_number, t.seat_number, p.first_name, p.last_name, p.passport_number, t.checked_in, t.boarded,
            (SELECT COUNT(*) FROM baggage bg WHERE bg.e_ticket_number = t.e_ticket_number) AS bag_count
       FROM ticket t
       JOIN booking b         ON b.booking_id = t.booking_id
       JOIN booking_status bs ON bs.booking_status_id = b.booking_status_id
       JOIN passenger p       ON p.passenger_id = t.passenger_id
      WHERE t.flight_id = ? AND bs.booking_status_name = 'CONFIRMED'
      ORDER BY CAST(t.seat_number AS UNSIGNED), t.seat_number`,
    [flight.flight_id],
  );

  return (
    <GateBoard
      key={flight.flight_id}
      flight={flight}
      gateStatuses={statuses.map((status) => status.gate_status_name)}
      departureGates={gatesAt(flight.origin_airport_id)}
      arrivalGates={gatesAt(flight.destination_airport_id)}
      passengers={passengers}
    />
  );
}
