import Link from "next/link";

// Customer site header from the mockups: navy bar, logo, main links, Sign Up and Log In.
// Pass the section the page belongs to so its link is underlined: <SiteHeader active="book" />.
// Once login exists (src/lib/session.ts), the right side shows "Hi, <first name>" and the
// points balance instead of Sign Up and Log In. Database: passenger.first_name and
// user.loyalty_points of the signed-in user. Nothing else here comes from the database.

// Section (a TypeScript type): the only four values `active` can be. A typo such as
// active="checkin" is underlined in VS Code and stops `pnpm build`.
type Section = "book" | "check-in" | "my-trips" | "flight-status";

// The links in the bar, in order: which Section each belongs to, its text, and its URL.
const links: { section: Section; label: string; href: string }[] = [
  { section: "book", label: "Book", href: "/" },
  { section: "check-in", label: "Check In", href: "/check-in" },
  { section: "my-trips", label: "My Trips", href: "/my-trips" },
  { section: "flight-status", label: "Flight Status", href: "/flight-status" },
];

// Props:
// - active  which link to underline. The "?" makes it optional: leave it out on pages that
//           belong to none of the four, such as /help.
export function SiteHeader({ active }: { active?: Section }) {
  return (
    <header className="bg-azure-navy text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-wide">
          <PlaneIcon />
          AZURE AIR
        </Link>

        <nav aria-label="Main" className="flex gap-6 self-stretch">
          {links.map((link) => {
            const isActive = link.section === active;
            return (
              <Link
                key={link.section}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center border-b-2 text-xs font-semibold tracking-wider uppercase ${
                  isActive ? "border-azure-blue" : "border-transparent text-white/75 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4 text-sm">
          <Link href="/register" className="font-semibold underline underline-offset-4 hover:text-white/80">
            Sign Up
          </Link>
          <Link href="/login" className="rounded bg-azure-blue px-4 py-2 font-semibold hover:bg-azure-blue-dark">
            Log In
          </Link>
        </div>
      </div>
    </header>
  );
}

function PlaneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 rotate-45 fill-sky-300">
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
    </svg>
  );
}
