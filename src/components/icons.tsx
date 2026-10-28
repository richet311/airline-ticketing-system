import type { ReactNode } from "react";

type IconProps = { className?: string };

function Icon({ className = "h-5 w-5", children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export function PlaneIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path
        transform="rotate(45 12 12)"
        d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"
      />
    </Icon>
  );
}

export function TicketIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
      <path d="M15 6v12" strokeDasharray="2 2" />
    </Icon>
  );
}

export function SuitcaseIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <rect x="3" y="7" width="18" height="13" rx="1.5" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12h18" />
    </Icon>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  );
}

export function BagIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <rect x="6" y="7" width="12" height="12" rx="1.5" />
      <path d="M9 7V4h6v3M10 10v6M14 10v6M8 19v2M16 19v2" />
    </Icon>
  );
}

export function SwapIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" />
    </Icon>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m3.5 6 8.5 7 8.5-7" />
    </Icon>
  );
}

export function XCircleIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </Icon>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </Icon>
  );
}
