import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { signOut } from "@/app/login/actions";
import { DawnCrest } from "@/components/Logo";
import { MailIcon } from "@/components/icons";
import { countUnread } from "@/lib/inbox";
import { canUse, OPERATIONS_MANAGER } from "@/lib/roles";
import { getCurrentUser, getSignedInEmployee } from "@/lib/session";

type Section = "book" | "check-in" | "my-trips" | "flight-status";

const links: { section: Section; label: string; href: string }[] = [
  { section: "book", label: "Book", href: "/" },
  { section: "check-in", label: "Check In", href: "/check-in" },
  { section: "my-trips", label: "My Trips", href: "/my-trips" },
  { section: "flight-status", label: "Flight Status", href: "/flight-status" },
];

const moreLinks = [{ label: "Azure Rewards", href: "/loyalty" }];

export function SiteHeader({ active, minimal = false }: { active?: Section; minimal?: boolean }) {
  return (
    <header className="bg-azure-navy text-white">
      <div
        className={`mx-auto flex h-17 max-w-6xl items-center px-4 ${minimal ? "justify-center" : "gap-10"}`}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-lg font-semibold tracking-[0.18em]">
          <DawnCrest ribbon={false} className="h-12 w-auto" />
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
        <Suspense fallback={null}>
          <Account />
        </Suspense>
      </div>
    </>
  );
}

async function Account() {
  await connection();
  const [user, employee] = await Promise.all([getCurrentUser(), getSignedInEmployee()]);

  if (!user) {
    return (
      <>
        <Link href="/register" className="hover:underline hover:underline-offset-4">
          Sign Up
        </Link>
        <Link href="/login" className="rounded-control bg-azure-blue px-5 py-2.5 hover:bg-azure-blue-dark">
          Log In
        </Link>
      </>
    );
  }

  const first = employee?.first_name ?? user.first_name;
  const last = employee?.last_name ?? user.last_name;
  const name = first || last ? `${first ?? ""} ${last ?? ""}`.trim() : user.email;
  const unread = await countUnread(user.user_id);

  return (
    <>
      <InboxLink unread={unread} />
      <span className="tracking-normal normal-case">{name}</span>
      {employee && canUse(employee.job_role_name, [OPERATIONS_MANAGER]) && (
        <Link href="/employee/admin/reports" className="rounded-control bg-azure-blue px-4 py-2 hover:bg-azure-blue-dark">
          Reports
        </Link>
      )}
      <form action={signOut}>
        <button type="submit" className="rounded-control border border-white/40 px-4 py-2 uppercase hover:bg-white/10">
          Sign out
        </button>
      </form>
    </>
  );
}

function InboxLink({ unread }: { unread: number }) {
  return (
    <Link
      href="/account/notifications"
      aria-label={unread > 0 ? `Inbox, ${unread} unread` : "Inbox"}
      className="relative text-white/80 hover:text-white"
    >
      <MailIcon className="h-6 w-6" />
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-2.5 rounded-full bg-azure-blue px-1.5 text-[11px] leading-[18px] font-semibold tracking-normal text-white">
          {unread}
        </span>
      )}
    </Link>
  );
}
