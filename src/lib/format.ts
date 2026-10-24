//handles formatting of various fields
export function formatMoney(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function formatDate(value: string, timeZone = "UTC"): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: isDateOnly(value) ? "UTC" : timeZone,
  }).format(fromDatabase(value));
}

export function formatMonthDay(value: string, timeZone = "UTC"): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone }).format(fromDatabase(value));
}

export function formatTime(value: string, timeZone = "UTC"): string {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone }).format(
    fromDatabase(value),
  );
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  return hours === 0 ? `${minutes % 60}m` : `${hours}h ${minutes % 60}m`;
}

function isDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function fromDatabase(value: string): Date {
  const iso = isDateOnly(value) ? `${value}T00:00:00Z` : `${value.replace(" ", "T")}Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`format.ts: "${value}" is not a date from the database.`);
  }
  return date;
}
