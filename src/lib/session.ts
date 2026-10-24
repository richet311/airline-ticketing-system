import "server-only";

import { createHmac, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { cache } from "react";

import { db } from "@/lib/db";
import type { CurrentUser, SignedInEmployee } from "@/lib/types";

//Login helpers include the passwords, the session cookie, and who is signed in.
//The cookie is SESSION_SECRET from .env.local.

const COOKIE_NAME = "session";
const SESSION_DAYS = 7;

//Passwords are stored as plain text in user.password_hash, but in case we wanted to store hashes
const SCRYPT_KEY_BYTES = 64;

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keyLength: number) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  return password;
}

//True when the typed password matches what's stored in the db, a plain text or an older hash value
//from a prior implementation
export async function checkPassword(password: string, storedHash: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = storedHash.split("$");
  if (scheme === "scrypt" && saltHex && keyHex) {
    const storedKey = Buffer.from(keyHex, "hex");
    if (storedKey.length !== SCRYPT_KEY_BYTES) return false;
    const key = await scryptAsync(password, Buffer.from(saltHex, "hex"), SCRYPT_KEY_BYTES);
    return timingSafeEqual(key, storedKey);
  }
  return password === storedHash;
}

export async function startSession(userId: number, keepLoggedIn = true): Promise<void> {
  const expires = Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 60 * 60;
  const payload = `${userId}.${expires}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: keepLoggedIn ? SESSION_DAYS * 24 * 60 * 60 : undefined,
  });
}

export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const userId = await readSessionUserId();
  if (userId === null) return null;

  const [users] = await db.query<CurrentUser[]>(
    `SELECT u.user_id, u.email, u.loyalty_points, p.passenger_id, p.first_name, p.last_name
       FROM user u
       LEFT JOIN passenger p ON p.user_id = u.user_id
      WHERE u.user_id = ?`,
    [userId],
  );
  return users[0] ?? null;
});

export const getSignedInEmployee = cache(async (): Promise<SignedInEmployee | null> => {
  const userId = await readSessionUserId();
  if (userId === null) return null;

  const [employees] = await db.query<SignedInEmployee[]>(
    `SELECT e.employee_id, e.user_id, e.first_name, e.last_name, e.job_role_id, j.job_role_name,
            e.assigned_gate_id
       FROM employee e
       JOIN job_role j ON j.job_role_id = e.job_role_id
      WHERE e.user_id = ? AND e.is_active = 1`,
    [userId],
  );
  return employees[0] ?? null;
});

async function readSessionUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (!value) return null;

  const [userId, expires, signature] = value.split(".");
  if (!userId || !expires || !signature) return null;

  const expected = Buffer.from(sign(`${userId}.${expires}`));
  const received = Buffer.from(signature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  if (Number(expires) * 1000 < Date.now()) return null;

  return Number(userId);
}

function sign(text: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or shorter than 32 characters in .env.local. See .env.example for how to make one, then restart pnpm dev.",
    );
  }
  return createHmac("sha256", secret).update(text).digest("base64url");
}
