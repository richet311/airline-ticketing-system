import Link from "next/link";

const popularTopics = [
  { label: "Baggage policy", href: "/travel-info" },
  { label: "Change & cancel policy", href: "/travel-info" },
  { label: "Contact us", href: "/help" },
];

const columns = [
  {
    title: "Travel",
    links: [
      { label: "Book a flight", href: "/" },
      { label: "Check in", href: "/check-in" },
      { label: "My Trips", href: "/my-trips" },
      { label: "Flight status", href: "/flight-status" },
    ],
  },
  {
    title: "Azure Rewards",
    links: [
      { label: "Join for free", href: "/register" },
      { label: "Log in", href: "/login" },
      { label: "How points work", href: "/loyalty" },
    ],
  },
  {
    title: "Customer service",
    links: [
      { label: "Help center", href: "/help" },
      { label: "Baggage policy", href: "/travel-info" },
      { label: "Change & cancel policy", href: "/travel-info" },
    ],
  },
  {
    title: "Company",
    links: [{ label: "Employee portal", href: "/login/employee" }],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-azure-midnight text-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="border-b border-white/15 py-12 text-center">
          <p className="text-3xl font-light">How can we help?</p>
          <p className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <span className="text-white/60">Popular topics:</span>
            {popularTopics.map((topic) => (
              <Link key={topic.label} href={topic.href} className="font-semibold hover:underline hover:underline-offset-4">
                {topic.label}
              </Link>
            ))}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-8 py-12">
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="mb-4 text-[11px] font-semibold tracking-widest text-white/55 uppercase">{column.title}</h2>
              <ul className="space-y-2.5 text-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-white/90 hover:text-white hover:underline hover:underline-offset-4">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-6 border-t border-white/15 py-6 text-xs text-white/55">
          <p className="font-semibold tracking-[0.18em] text-white/80">AZURE AIR</p>
          <p>© Azure Air · A course project: flights, fares and bookings are sample data.</p>
        </div>
      </div>
    </footer>
  );
}
