// Shared frame for every /employee page · mockup Phase 4 (Agent and Admin dashboards):
// navy header (search bar, role badge, name, Sign out) and the white side menu.
// Agent and admin pages render inside it, where {children} is.
export default function EmployeeLayout({ children }: LayoutProps<"/employee">) {
  return <>{children}</>;
}
