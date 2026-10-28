import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowRightIcon, ClockIcon, SuitcaseIcon, TicketIcon } from "@/components/icons";

const cards = [
  {
    title: "Check in online",
    text: "Check in starting 24 hours before your flight.",
    linkText: "Check in",
    href: "/check-in",
    icon: <TicketIcon className="h-10 w-10" />,
    gradient: "from-azure-hero to-azure-blue",
  },
  {
    title: "Manage your trip",
    text: "Look up a booking to see your flights, seats and payments.",
    linkText: "Go to My Trips",
    href: "/my-trips",
    icon: <SuitcaseIcon className="h-9 w-9" />,
    gradient: "from-azure-navy to-azure-hero",
  },
  {
    title: "Track a flight",
    text: "See if a flight is on time.",
    linkText: "Check flight status",
    href: "/flight-status",
    icon: <ClockIcon className="h-9 w-9" />,
    gradient: "from-azure-blue to-sky-500",
  },
];

export function QuickLinks() {
  const [wide, ...rest] = cards;

  return (
    <div className="space-y-6">
      <Card card={wide} className="grid grid-cols-[2fr_3fr]" artClassName="min-h-56" />

      <div className="grid grid-cols-2 gap-6">
        {rest.map((card) => (
          <Card key={card.title} card={card} className="flex flex-col" artClassName="h-40" />
        ))}
      </div>
    </div>
  );
}

function Card({ card, className, artClassName }: { card: (typeof cards)[number]; className: string; artClassName: string }) {
  return (
    <Link
      href={card.href}
      className={`group overflow-hidden rounded-card border border-gray-200 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:border-azure-blue hover:shadow-xl ${className}`}
    >
      <CardArt icon={card.icon} gradient={card.gradient} className={artClassName} />
      <div className="flex flex-1 flex-col justify-center p-7">
        <h3 className="text-xl font-semibold text-azure-navy">{card.title}</h3>
        <p className="mt-2 flex-1 text-[15px] leading-relaxed text-gray-600">{card.text}</p>
        <span className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-azure-blue group-hover:underline">
          {card.linkText}
          <ArrowRightIcon className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function CardArt({ icon, gradient, className }: { icon: ReactNode; gradient: string; className: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-linear-to-br transition duration-500 group-hover:scale-105 ${gradient} ${className}`}>
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full text-white/25"
      >
        <path d="M-10 175 C 110 35, 290 35, 410 125" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 9" />
        <circle cx="318" cy="64" r="4" fill="currentColor" />
      </svg>
      <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30">
        {icon}
      </span>
    </div>
  );
}
