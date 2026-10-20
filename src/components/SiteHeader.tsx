import Link from "next/link";

// TODO: show the signed-in user's name and points instead of Sign Up / Log In

type Section = "book" | "check-in" | "my-trips" | "flight-status";

const links: { section: Section; label: string; href: string }[] = [
  { section: "book", label: "Book", href: "/" },
  { section: "check-in", label: "Check In", href: "/check-in" },
  { section: "my-trips", label: "My Trips", href: "/my-trips" },
  { section: "flight-status", label: "Flight Status", href: "/flight-status" },
];

const moreLinks = [
  { label: "Travel Info", href: "/travel-info" },
  { label: "Azure Rewards", href: "/loyalty" },
  { label: "Need Help?", href: "/help" },
];

export function SiteHeader({ active, minimal = false }: { active?: Section; minimal?: boolean }) {
  return (
    <header className="bg-azure-navy text-white">
      <div
        className={`mx-auto flex h-17 max-w-6xl items-center px-4 ${minimal ? "justify-center" : "gap-10"}`}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-lg font-semibold tracking-[0.18em]">
          <LogoIcon />
          AZURE AIR
        </Link>

        {!minimal && <MainLinks active={active} />}
      </div>
    </header>
  );
}

function MainLinks({ active }: { active?: Section }) {
  return (
    <>
      <nav aria-label="Main" className="flex gap-6 self-stretch">
        {links.map((link) => {
          const isActive = link.section === active;
          return (
            <Link
              key={link.section}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center border-y-[3px] border-t-transparent text-[13px] font-semibold tracking-widest uppercase ${
                isActive ? "border-b-azure-blue" : "border-b-transparent text-white/75 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <nav aria-label="More" className="ml-auto flex items-center gap-5 text-[13px] text-white/80">
        {moreLinks.map((link) => (
          <Link key={link.label} href={link.href} className="hover:text-white hover:underline hover:underline-offset-4">
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4 border-l border-white/20 pl-5 text-[13px] font-semibold tracking-widest uppercase">
        <Link href="/register" className="hover:underline hover:underline-offset-4">
          Sign Up
        </Link>
        <Link href="/login" className="rounded-control bg-azure-blue px-5 py-2.5 hover:bg-azure-blue-dark">
          Log In
        </Link>
      </div>
    </>
  );
}

function LogoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 rotate-45 fill-sky-300">
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
    </svg>
  );
}
