import Link from "next/link";

const columns = [
  {
    title: "Travel",
    links: [
      { label: "Book a flight", href: "/" },
      { label: "Check in", href: "/check-in" },
      { label: "Flight status", href: "/flight-status" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Baggage policy", href: "/travel-info" },
      { label: "Change & cancel policy", href: "/travel-info" },
      { label: "Contact us", href: "/help" },
    ],
  },
  {
    title: "Company",
    links: [{ label: "Employee login", href: "/login" }],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">{column.title}</h2>
            <ul className="space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-azure-blue underline-offset-4 hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="border-t border-gray-100 px-4 py-4 text-center text-xs text-gray-500">
        © Azure Air
      </p>
    </footer>
  );
}
