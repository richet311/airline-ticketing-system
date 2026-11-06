import "server-only";

import { timingSafeEqual } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { connection } from "next/server";

import { db } from "@/lib/db";
import { getCurrentUser, sign } from "@/lib/session";

// Who can open a booking's pages and actions (trip details, check-in, change, cancel, confirmation):
// - a signed-in customer who booked it or is flying on it, or
// - a browser that found it with the confirmation code and last name. That lookup is remembered
//   in a signed cookie for a day, so the confirmation code alone isn't enough.

const TRIP_COOKIE = "trip_access";
const TRIP_ACCESS_HOURS = 24;
const MAX_REMEMBERED_TRIPS = 20;

export async function canOpenTrip(bookingId: string): Promise<boolean> {
  if ((await lookedUpTrips()).includes(bookingId)) return true;

  const user = await getCurrentUser();
  if (!user) return false;

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT 1
       FROM booking b
       JOIN passenger bp ON bp.passenger_id = b.passenger_id
      WHERE b.booking_id = ?
        AND (bp.user_id = ?
             OR EXISTS (SELECT 1
                          FROM ticket t
                          JOIN passenger tp ON tp.passenger_id = t.passenger_id
                         WHERE t.booking_id = b.booking_id AND tp.user_id = ?))
      LIMIT 1`,
    [bookingId, user.user_id, user.user_id],
  );
  return rows.length > 0;
}

// Call from a server action once the confirmation code and last name have been checked
export async function rememberTrip(bookingId: string): Promise<void> {
  const trips = [bookingId, ...(await lookedUpTrips()).filter((id) => id !== bookingId)].slice(0, MAX_REMEMBERED_TRIPS);
  const expires = Math.floor(Date.now() / 1000) + TRIP_ACCESS_HOURS * 60 * 60;
  const payload = `${trips.join("-")}.${expires}`;

  const cookieStore = await cookies();
  cookieStore.set(TRIP_COOKIE, `${payload}.${sign(`trip:${payload}`)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TRIP_ACCESS_HOURS * 60 * 60,
  });
}

// booking ids this browser has looked up, if the cookie is genuine and hasn't expired
async function lookedUpTrips(): Promise<string[]> {
  // request time only: checking the cookie's expiry reads the clock
  await connection();
  const cookieStore = await cookies();
  const value = cookieStore.get(TRIP_COOKIE)?.value;
  if (!value) return [];

  const [trips, expires, signature] = value.split(".");
  if (!trips || !expires || !signature) return [];

  const expected = Buffer.from(sign(`trip:${trips}.${expires}`));
  const received = Buffer.from(signature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return [];
  if (Number(expires) * 1000 < Date.now()) return [];

  return trips.split("-");
}
