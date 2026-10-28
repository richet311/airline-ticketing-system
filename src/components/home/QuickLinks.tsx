import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";

const cards = [
  {
    title: "Check in online",
    text: "Check in starting 24 hours before your flight.",
    linkText: "Check in",
    href: "/check-in",
    image: "/home/check-in.webp",
  },
  {
    title: "Manage your trip",
    text: "Look up a booking to see your flights, seats and payments.",
    linkText: "Go to My Trips",
    href: "/my-trips",
    image: "/home/manage-trip.webp",
  },
  {
    title: "Track a flight",
    text: "See if a flight is on time.",
    linkText: "Check flight status",
    href: "/flight-status",
    image: "/home/track-flight.webp",
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
      <div className={`relative overflow-hidden bg-azure-navy ${artClassName}`}>
        <Image
          src={card.image}
          alt=""
          fill
          sizes="(min-width: 1152px) 560px, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
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
