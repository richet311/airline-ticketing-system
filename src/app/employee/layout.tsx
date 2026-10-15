// Shared frame for every /employee page · mockup Phase 4 (Agent and Admin dashboards):
// navy header (search bar, role badge, name, Sign out) and the white side menu.
// Agent and admin pages render inside it, where {children} is.
// LayoutProps<"/employee"> is a type Next.js makes from the folder names. Its children prop
// is the page being shown. Database: none yet; the header's name and role will come from
// the signed-in employee (employee.first_name, job_role.job_role_name).
export default function EmployeeLayout({ children }: LayoutProps<"/employee">) {
  return <>{children}</>;
}
