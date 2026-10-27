import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// guests need the last name lookup cookie, logged in users can open there own trips

const ACCESS_HOURS = 2;

function cookieName(bookingId: string): string {
  return `trip_${bookingId}`;
}

// server actions only (sets cookie)
export async function grantTripAccess(bookingId: string): Promise<void> {
  const expires = Math.floor(Date.now() / 1000) + ACCESS_HOURS * 60 * 60;
  const cookieStore = await cookies();
  cookieStore.set(cookieName(bookingId), `${expires}.${sign(`${bookingId}.${expires}`)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_HOURS * 60 * 60,
  });
}

export async function canOpenTrip(bookingId: string): Promise<boolean> {
  if (await hasAccessCookie(bookingId)) return true;

  const user = await getCurrentUser();
  if (!user || user.passenger_id === null) return false;

  // they made the booking or they're a traveler on it
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT 1
       FROM booking b
      WHERE b.booking_id = ?
        AND (b.passenger_id = ?
             OR EXISTS (SELECT 1 FROM ticket t WHERE t.booking_id = b.booking_id AND t.passenger_id = ?))`,
    [bookingId, user.passenger_id, user.passenger_id],
  );
  return rows.length > 0;
}

async function hasAccessCookie(bookingId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(cookieName(bookingId))?.value;
  if (!value) return false;

  const [expires, signature] = value.split(".");
  if (!expires || !signature) return false;

  const expected = Buffer.from(sign(`${bookingId}.${expires}`));
  const received = Buffer.from(signature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return false;
  return Number(expires) * 1000 >= Date.now();
}

// same signing as the login cookie in session.ts
function sign(text: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is missing or shorter than 32 characters in .env.local.");
  }
  return createHmac("sha256", secret).update(text).digest("base64url");
}
