type SearchParams = { [key: string]: string | string[] | undefined };

export const LOGIN_REQUIRED = "Please log in to book a flight.";

export function loginUrl(pathname: string, params: SearchParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      query.append(key, item);
    }
  }
  return `/login?${new URLSearchParams({ next: `${pathname}?${query}` })}`;
}

export function bookingPath(value: unknown): string | null {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/book/") ? path : null;
}
