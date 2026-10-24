import "server-only";

import { canUse } from "@/lib/roles";
import { getSignedInEmployee } from "@/lib/session";

export async function getSignedInStaff(allowedRoles: string[]) {
  const employee = await getSignedInEmployee();
  return employee && canUse(employee.job_role_name, allowedRoles) ? employee : null;
}

export async function getSignedInAdmin() {
  return getSignedInStaff([]);
}
