//what roles can see what
export const SYSTEM_ADMIN = "System Administrator";
export const OPERATIONS_MANAGER = "Operations Manager";
export const CUSTOMER_SERVICE_AGENT = "Customer Service Agent";
export const GATE_AGENT = "Gate Agent";

export function canUse(roleName: string, allowedRoles: string[]): boolean {
  return roleName === SYSTEM_ADMIN || allowedRoles.includes(roleName);
}
