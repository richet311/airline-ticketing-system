import Link from "next/link";

// The three quick-link cards under the booking card on Home.
// No props, and nothing comes from the database.

// The cards, in order: title, short text, and the page each one opens.
const quickLinks = [
  { title: "Check in", text: "Opens 24 hours before departure. Get your boarding pass.", href: "/check-in" },
  { title: "My Trips", text: "Find a trip with your confirmation code and last name.", href: "/my-trips" },
  { title: "Flight status", text: "Search by flight number or route for gate and timing.", href: "/flight-status" },
];

export function QuickLinks() {
  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {quickLinks.map((link) => (
        <li key={link.title}>
          <Link
            href={link.href}
            className="flex h-full gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-azure-blue"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-azure-sky text-azure-blue">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[2.5]">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span>
              <span className="block text-sm font-semibold text-azure-navy">{link.title}</span>
              <span className="block text-xs text-gray-500">{link.text}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
