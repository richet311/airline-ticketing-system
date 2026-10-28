import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { connection } from "next/server";

import { SiteHeader } from "@/components/SiteHeader";
import { BoardingPass } from "@/components/check-in/BoardingPass";
import { CheckCircleIcon, ClockIcon, MailIcon, TicketIcon, XCircleIcon } from "@/components/icons";
import { formatDate, formatTime } from "@/lib/format";
import { countUnread, getBoardingPass, getInbox, getMessage, inboxLink } from "@/lib/inbox";
import { getCurrentUser } from "@/lib/session";
import type { InboxMessage } from "@/lib/types";

import { markAllAsRead, openMessage } from "./actions";

function TypeLabel({ type }: { type: string }) {
  if (type === "BOARDING_PASS") {
    return (
      <span className="flex items-center gap-1.5 text-azure-blue">
        <TicketIcon className="h-4 w-4" />
        Boarding pass
      </span>
    );
  }
  if (type === "DELAYED") {
    return (
      <span className="flex items-center gap-1.5 text-amber-700">
        <ClockIcon className="h-4 w-4" />
        Flight delayed
      </span>
    );
  }
  if (type === "CANCELLED") {
    return (
      <span className="flex items-center gap-1.5 text-red-700">
        <XCircleIcon className="h-4 w-4" />
        Flight cancelled
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-green-700">
      <CheckCircleIcon className="h-4 w-4" />
      E-ticket
    </span>
  );
}

export default function InboxPage({ searchParams }: PageProps<"/account/notifications">) {
  return (
    <>
      <SiteHeader />

      <main className="flex-1 bg-azure-page">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Suspense fallback={<p className="text-gray-500">Loading your inbox...</p>}>
            <Inbox searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function Inbox({ searchParams }: { searchParams: Promise<{ show?: string; id?: string }> }) {
  const params = await searchParams;
  await connection();
  const user = await getCurrentUser();
  if (!user) return <SignedOut />;

  const unreadOnly = params.show === "unread";
  const openId = Number(params.id);

  const open = Number.isInteger(openId) ? await getMessage(user.user_id, openId) : null;
  const messages = await getInbox(user.user_id, unreadOnly);
  const unread = await countUnread(user.user_id);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-start gap-6">
      <section className="rounded-card border border-gray-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h1 className="text-xl font-semibold text-azure-navy">Inbox</h1>
          {unread > 0 && (
            <form action={markAllAsRead}>
              <button type="submit" className="text-sm font-semibold text-azure-blue hover:underline">
                Mark all read
              </button>
            </form>
          )}
        </div>

        <div className="flex gap-2 px-5 py-3 text-sm">
          <FilterTab href={inboxLink({ id: open?.notification_id })} active={!unreadOnly}>
            All
          </FilterTab>
          <FilterTab href={inboxLink({ id: open?.notification_id, unreadOnly: true })} active={unreadOnly}>
            Unread ({unread})
          </FilterTab>
        </div>

        {messages.length === 0 ? (
          <p className="px-5 pb-6 text-sm text-gray-600">
            {unreadOnly ? "You're all caught up." : "Messages about your trips will show up here."}
          </p>
        ) : (
          <ul>
            {messages.map((message) => (
              <MessageRow
                key={message.notification_id}
                message={message}
                isOpen={message.notification_id === open?.notification_id}
                unreadOnly={unreadOnly}
              />
            ))}
          </ul>
        )}
      </section>

      {open ? (
        <OpenMessage message={open} />
      ) : (
        <section className="rounded-card border border-gray-200 bg-white p-10 text-center shadow-card">
          <MailIcon className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-3 text-sm text-gray-600">Choose a message to read it.</p>
        </section>
      )}
    </div>
  );
}

function FilterTab({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-control px-3 py-1 font-semibold ${
        active ? "bg-azure-sky text-azure-blue-dark" : "text-gray-600 hover:text-azure-navy"
      }`}
    >
      {children}
    </Link>
  );
}

function MessageRow({ message, isOpen, unreadOnly }: { message: InboxMessage; isOpen: boolean; unreadOnly: boolean }) {
  const unread = message.is_read === 0;

  return (
    <li className="border-t border-gray-100">
      <form action={openMessage}>
        <input type="hidden" name="notification_id" value={message.notification_id} />
        {unreadOnly && <input type="hidden" name="show" value="unread" />}
        <button
          type="submit"
          aria-current={isOpen ? "true" : undefined}
          className={`block w-full cursor-pointer border-l-[3px] px-5 py-3 text-left hover:bg-azure-page ${
            isOpen ? "border-l-azure-blue bg-azure-sky" : unread ? "border-l-azure-blue" : "border-l-transparent"
          }`}
        >
          <span className="flex items-center justify-between gap-3 text-[11px] font-semibold tracking-widest uppercase">
            <TypeLabel type={message.notification_type} />
            <span className="font-normal tracking-normal text-gray-500 normal-case">{timeAgo(message.created_at)}</span>
          </span>
          <span className={`mt-1 block text-sm ${unread ? "font-semibold text-azure-navy" : "text-gray-700"}`}>
            {unread && <span className="sr-only">Unread: </span>}
            {message.subject}
          </span>
        </button>
      </form>
    </li>
  );
}

async function OpenMessage({ message }: { message: InboxMessage }) {
  const pass =
    message.notification_type === "BOARDING_PASS" && message.e_ticket_number
      ? await getBoardingPass(message.e_ticket_number)
      : null;

  return (
    <article className="space-y-5 rounded-card border border-t-4 border-gray-200 border-t-azure-blue bg-white p-6 shadow-card">
      <div>
        <p className="text-[11px] font-semibold tracking-widest uppercase">
          <TypeLabel type={message.notification_type} />
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-azure-navy">{message.subject}</h2>
        <p className="mt-1 text-xs text-gray-500">
          From Azure Air · {formatDate(message.created_at)}, {formatTime(message.created_at)} UTC
        </p>
      </div>

      <p className="leading-relaxed text-gray-700">{message.body}</p>

      {message.notification_type === "BOARDING_PASS" &&
        (pass ? (
          <BoardingPass pass={pass} />
        ) : (
          <p className="rounded-control bg-azure-page px-4 py-3 text-sm text-gray-600">
            This boarding pass isn&apos;t valid anymore.
          </p>
        ))}

      {message.booking_id && <MessageLinks message={message} />}
    </article>
  );
}

function MessageLinks({ message }: { message: InboxMessage }) {
  const primary =
    message.notification_type === "BOARDING_PASS"
      ? { label: "Open check-in", href: `/check-in/${message.booking_id}` }
      : { label: "View trip", href: `/my-trips/${message.booking_id}` };

  return (
    <div className="flex items-center gap-5">
      <Link
        href={primary.href}
        className="rounded-control bg-azure-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-azure-blue-dark"
      >
        {primary.label}
      </Link>
      {message.flight_id && (
        <Link href="/flight-status" className="text-sm font-semibold text-azure-blue hover:underline">
          Flight status
        </Link>
      )}
    </div>
  );
}

function SignedOut() {
  return (
    <section className="mx-auto max-w-lg rounded-card border border-t-4 border-gray-200 border-t-azure-blue bg-white p-6 shadow-card">
      <h1 className="text-2xl font-semibold text-azure-navy">Your inbox</h1>
      <p className="mt-2 text-gray-600">Log in to see your e-tickets, boarding passes and flight updates.</p>
      <Link
        href="/login"
        className="mt-5 inline-block rounded-control bg-azure-blue px-6 py-3 text-sm font-semibold text-white hover:bg-azure-blue-dark"
      >
        Log in
      </Link>
    </section>
  );
}

function timeAgo(createdAt: string): string {
  const minutes = Math.floor((Date.now() - new Date(`${createdAt.replace(" ", "T")}Z`).getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}h ago`;
  return formatDate(createdAt);
}
