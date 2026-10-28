//what roles can see what
export const SYSTEM_ADMIN = "System Administrator";
export const OPERATIONS_MANAGER = "Operations Manager";
export const CUSTOMER_SERVICE_AGENT = "Customer Service Agent";
export const GATE_AGENT = "Gate Agent";

export const REPORTS_PAGE = "/employee/admin/reports";

export function canUse(roleName: string, allowedRoles: string[]): boolean {
  return roleName === SYSTEM_ADMIN || allowedRoles.includes(roleName);
}

export function employeeHome(roleName: string): string {
  return canUse(roleName, [OPERATIONS_MANAGER]) ? "/employee/admin" : "/employee/agent";
}

export function employeePages(roleName: string): string[] {
  return canUse(roleName, [OPERATIONS_MANAGER]) ? [employeeHome(roleName), REPORTS_PAGE] : [employeeHome(roleName)];
}
