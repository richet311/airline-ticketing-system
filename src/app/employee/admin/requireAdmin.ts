import "server-only";

import { canUse } from "@/lib/roles";
import { getSignedInEmployee } from "@/lib/session";

// The signed-in employee if their role may use a tool (System Administrators always may), or null.
// Every portal action checks this before saving.
export async function getSignedInStaff(allowedRoles: string[]) {
  const employee = await getSignedInEmployee();
  return employee && canUse(employee.job_role_name, allowedRoles) ? employee : null;
}

// The signed-in System Administrator, or null.
export async function getSignedInAdmin() {
  return getSignedInStaff([]);
}
