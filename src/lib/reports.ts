type SearchParams = { [key: string]: string | string[] | undefined };

export const REPORTS_PAGE = "/employee/admin/reports";

export const REPORTS = {
  revenue: {
    href: `${REPORTS_PAGE}/revenue`,
    area: "Revenue",
    title: "Revenue per 100 Miles by Route",
    question: "Which routes earn the most for every 100 passenger-miles",
  },
  operations: {
    href: `${REPORTS_PAGE}/operations`,
    area: "Operations",
    title: "Flight Status and Seats Filled",
    question: "Are flights on schedule and statistics on seats sold as a percentage of overall flight capacity",
  },
  customers: {
    href: `${REPORTS_PAGE}/customers`,
    area: "Customers",
    title: "Most Valuable Customers",
    question: "Who are our best patrons. What are their spendings and reward statuses",
  },
};

export type Report = (typeof REPORTS)[keyof typeof REPORTS];

export type ReportFilters = { from: string; to: string; route: string; cabin: string; tier: string; minTickets: string };

export function readReportFilters(params: SearchParams): ReportFilters {
  function text(name: string): string {
    const value = params[name];
    return (Array.isArray(value) ? value[0] : (value ?? "")).trim();
  }
  const date = (name: string) => (/^\d{4}-\d{2}-\d{2}$/.test(text(name)) ? text(name) : "");

  return {
    from: date("from"),
    to: date("to"),
    route: text("route").toUpperCase(),
    cabin: text("cabin").toUpperCase(),
    tier: text("tier").toUpperCase(),
    minTickets: text("min_tickets"),
  };
}

export function addDateRange(where: string[], values: (string | number)[], column: string, filters: ReportFilters) {
  if (filters.from) {
    where.push(`${column} >= ?`);
    values.push(filters.from);
  }
  if (filters.to) {
    where.push(`${column} < ? + INTERVAL 1 DAY`);
    values.push(filters.to);
  }
}
