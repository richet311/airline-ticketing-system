import type { RowDataPacket } from "mysql2";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { AddAircraftForm } from "@/components/admin/AddAircraftForm";
import { AddAirportForm } from "@/components/admin/AddAirportForm";
import { AdminTable, AdminTile } from "@/components/admin/AdminTile";
import { AircraftRow } from "@/components/admin/AircraftRow";
import { AirportRow } from "@/components/admin/AirportRow";
import { FlightOpsRow } from "@/components/admin/FlightOpsRow";
import { ScheduleFlightForm } from "@/components/admin/ScheduleFlightForm";
import { pageNumber, TilePager } from "@/components/admin/TilePager";
import { bookingFilterParams, BookingsTile } from "@/components/agent/BookingsTile";
import { EmployeeHeader } from "@/components/employee/EmployeeHeader";
import { gateFlightFromUrl, GateTile } from "@/components/gate/GateTile";
import { db } from "@/lib/db";
import { attentionReason } from "@/lib/flightRules";
import { canUse, CUSTOMER_SERVICE_AGENT, GATE_AGENT, OPERATIONS_MANAGER } from "@/lib/roles";
import { getSignedInEmployee } from "@/lib/session";
import type { Airport, AircraftListRow, FlightStatus, GateOption, MaintenanceStatus, OpsFlightRow } from "@/lib/types";

export const instant = false;

type SearchParams = Awaited<PageProps<"/employee/admin">["searchParams"]>;

const BASE_PATH = "/employee/admin";
const TILE_PAGE_SIZE = 10;

//This is the main employee portal page where signed in staff members can view their functions
//It's segmented into tiles that each role can see
export default async function AdminPage({ searchParams }: PageProps<"/employee/admin">) {
  // check before streaming starts, so a signed-out visitor gets a redirect instead of a blank page
  await connection();
  if (!(await getSignedInEmployee())) redirect("/login/employee");

  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Loading...</p>}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/employee/admin">["searchParams"] }) {
  await connection();
  const employee = await getSignedInEmployee();
  if (!employee) redirect("/login/employee");
  const role = employee.job_role_name;
  const params = await searchParams;
  const gateFlight = gateFlightFromUrl(params);

  const tiles = [
    canUse(role, []) && <AircraftTile key="aircraft" params={params} />,
    canUse(role, []) && <AirportsTile key="airports" params={params} />,
    canUse(role, []) && <FlightsTile key="flights" />,
    canUse(role, [OPERATIONS_MANAGER]) && <ScheduledFlightsTile key="scheduled-flights" params={params} />,
    canUse(role, [CUSTOMER_SERVICE_AGENT]) && <BookingsTile key="bookings" params={params} basePath="/employee/admin" />,
    canUse(role, [GATE_AGENT]) && (
      <GateTile key="gate" flightNumber={gateFlight} basePath="/employee/admin" keep={bookingFilterParams(params)} />
    ),
  ].filter(Boolean);

  return (
    <>
      <EmployeeHeader employee={employee} />
      <main className="flex-1 bg-azure-page">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
          {tiles.length > 0 ? (
            tiles
          ) : (
            <p className="rounded-card border border-gray-200 bg-white p-6 text-gray-600">
              There are no tools for your role here yet.
            </p>
          )}
        </div>
      </main>
    </>
  );
}

async function AircraftTile({ params }: { params: SearchParams }) {
  const [[counted]] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM aircraft");
  const total = Number(counted.total);
  const page = pageNumber(params, "aircraft_page", total, TILE_PAGE_SIZE);
  const [aircraft] = await db.query<AircraftListRow[]>(
    `SELECT a.aircraft_id, a.aircraft_number, a.aircraft_type, a.capacity, m.maintenance_status_name
       FROM aircraft a
       JOIN maintenance_status m ON m.maintenance_status_id = a.maintenance_status_id
      ORDER BY a.aircraft_number
      LIMIT ? OFFSET ?`,
    [TILE_PAGE_SIZE, (page - 1) * TILE_PAGE_SIZE],
  );
  const [statuses] = await db.query<MaintenanceStatus[]>(
    "SELECT * FROM maintenance_status ORDER BY maintenance_status_id",
  );

  return (
    <AdminTile overline="Fleet" title="Aircraft">
      <AddAircraftForm statuses={statuses.map((status) => status.maintenance_status_name)} />
      <AdminTable headings={["Number", "Type", "Capacity", "Status", ""]}>
        {aircraft.map((plane) => (
          <AircraftRow key={plane.aircraft_id} plane={plane} statuses={statuses.map((status) => status.maintenance_status_name)} />
        ))}
      </AdminTable>
      <TilePager basePath={BASE_PATH} params={params} name="aircraft_page" page={page} size={TILE_PAGE_SIZE} total={total} noun="Aircraft" />
    </AdminTile>
  );
}

async function AirportsTile({ params }: { params: SearchParams }) {
  const [[counted]] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM airport");
  const total = Number(counted.total);
  const page = pageNumber(params, "airports_page", total, TILE_PAGE_SIZE);
  const [airports] = await db.query<Airport[]>("SELECT * FROM airport ORDER BY airport_code LIMIT ? OFFSET ?", [
    TILE_PAGE_SIZE,
    (page - 1) * TILE_PAGE_SIZE,
  ]);

  return (
    <AdminTile overline="Network" title="Airports">
      <AddAirportForm />
      <AdminTable headings={["Code", "Name", "City", "Country", "Time zone", ""]}>
        {airports.map((airport) => (
          <AirportRow key={airport.airport_id} airport={airport} />
        ))}
      </AdminTable>
      <TilePager basePath={BASE_PATH} params={params} name="airports_page" page={page} size={TILE_PAGE_SIZE} total={total} noun="Airports" />
    </AdminTile>
  );
}

async function FlightsTile() {
  const [airports] = await db.query<Airport[]>("SELECT * FROM airport ORDER BY airport_code");
  const [aircraft] = await db.query<AircraftListRow[]>(
    `SELECT a.aircraft_id, a.aircraft_number, a.aircraft_type, a.capacity, m.maintenance_status_name
       FROM aircraft a
       JOIN maintenance_status m ON m.maintenance_status_id = a.maintenance_status_id
      WHERE m.maintenance_status_name = 'OPERATIONAL'
      ORDER BY a.aircraft_number`,
  );

  return (
    <AdminTile overline="Flight operations" title="Schedule a flight">
      <ScheduleFlightForm
        airports={airports}
        aircraft={aircraft.map(({ aircraft_number, aircraft_type, capacity }) => ({ aircraft_number, aircraft_type, capacity }))}
      />
    </AdminTile>
  );
}

//Pulling attributes from the db for scheduled flights
async function ScheduledFlightsTile({ params }: { params: SearchParams }) {
  const [flights] = await db.query<OpsFlightRow[]>(
    `SELECT f.flight_id, f.flight_number, f.departure_time, f.arrival_time,
            TIMESTAMPDIFF(MINUTE, f.departure_time, f.arrival_time) AS duration_min,
            o.airport_code AS origin, d.airport_code AS destination,
            fs.flight_status_name, a.aircraft_number,
            f.origin_airport_id, f.destination_airport_id, f.departure_gate_id, f.arrival_gate_id,
            f.departure_time <= UTC_TIMESTAMP() AS past_departure, f.arrival_time <= UTC_TIMESTAMP() AS past_arrival
       FROM flight f
       JOIN airport o        ON o.airport_id = f.origin_airport_id
       JOIN airport d        ON d.airport_id = f.destination_airport_id
       JOIN flight_status fs ON fs.flight_status_id = f.flight_status_id
       JOIN aircraft a       ON a.aircraft_id = f.aircraft_id
      ORDER BY f.departure_time`,
  );
  //Pulling attributes from the db for gates, terminals, and statuses
  const [gates] = await db.query<GateOption[]>(
    `SELECT g.gate_id, t.airport_id, t.terminal_name, g.gate_number, gs.gate_status_name
       FROM gate g
       JOIN terminal t     ON t.terminal_id = g.terminal_id
       JOIN gate_status gs ON gs.gate_status_id = g.gate_status_id
      ORDER BY t.terminal_name, g.gate_number`,
  );
  const [statuses] = await db.query<FlightStatus[]>("SELECT * FROM flight_status ORDER BY flight_status_id");

  const gatesAt = (airportId: number) =>
    gates
      .filter((gate) => gate.airport_id === airportId)
      .map((gate) => ({ gate_id: gate.gate_id, label: `${gate.terminal_name} · ${gate.gate_number}`, status: gate.gate_status_name }));
  const needAttention = flights.filter(
    (flight) =>
      attentionReason({
        status: flight.flight_status_name,
        hasDepartureGate: flight.departure_gate_id !== null,
        hasArrivalGate: flight.arrival_gate_id !== null,
        pastDeparture: flight.past_departure === 1,
        pastArrival: flight.past_arrival === 1,
      }) !== null,
  ).length;
  const page = pageNumber(params, "flights_page", flights.length, TILE_PAGE_SIZE);
  const shown = flights.slice((page - 1) * TILE_PAGE_SIZE, page * TILE_PAGE_SIZE);

  return (
    <AdminTile overline="Flight operations" title="Scheduled flights">
      <p className="text-sm text-gray-600">
        Statuses move to Departed and Arrived on their own.{" "}
        {needAttention > 0 && (
          <span className="text-amber-700">
            {needAttention} {needAttention === 1 ? "flight needs" : "flights need"} attention below.
          </span>
        )}
      </p>
      <AdminTable headings={["Flight", "Route", "Departs (UTC)", "Aircraft", "Departure gate", "Arrival gate", "Status"]}>
        {shown.map((flight) => (
          <FlightOpsRow
            key={flight.flight_id}
            flight={flight}
            departureGates={gatesAt(flight.origin_airport_id)}
            arrivalGates={gatesAt(flight.destination_airport_id)}
            statuses={statuses.map((status) => status.flight_status_name)}
          />
        ))}
      </AdminTable>
      <TilePager
        basePath={BASE_PATH}
        params={params}
        name="flights_page"
        page={page}
        size={TILE_PAGE_SIZE}
        total={flights.length}
        noun="Flights"
      />
    </AdminTile>
  );
}
