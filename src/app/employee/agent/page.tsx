import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { BookingsTile } from "@/components/agent/BookingsTile";
import { EmployeeHeader } from "@/components/employee/EmployeeHeader";
import { gateFlightFromUrl, GateTile } from "@/components/gate/GateTile";
import { canUse, CUSTOMER_SERVICE_AGENT, GATE_AGENT } from "@/lib/roles";
import { getSignedInEmployee } from "@/lib/session";

// Agent portal page (staff sign-in sends Customer Service, Gate and Tarmac Agents here).
// Same idea as /employee/admin: each tile lists the roles that can see it.
export default function AgentPage({ searchParams }: PageProps<"/employee/agent">) {
  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Loading...</p>}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/employee/agent">["searchParams"] }) {
  // only at request time (mysql2 calls Date.now(), which breaks prerendering)
  await connection();
  const employee = await getSignedInEmployee();
  if (!employee) redirect("/login/employee");
  const role = employee.job_role_name;
  const gateFlight = gateFlightFromUrl(await searchParams);

  const tiles = [
    canUse(role, [GATE_AGENT]) && <GateTile key="gate" flightNumber={gateFlight} basePath="/employee/agent" />,
    canUse(role, [CUSTOMER_SERVICE_AGENT]) && <BookingsTile key="bookings" />,
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
