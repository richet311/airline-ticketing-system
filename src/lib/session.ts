import "server-only";

import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { cache } from "react";

import { db } from "@/lib/db";
import type { CurrentUser, SignedInEmployee } from "@/lib/types";

//Login helpers include the passwords, the session cookie, and who is signed in.
//The cookie is SESSION_SECRET from .env.local.

export const SESSION_COOKIE = "session";
const SESSION_DAYS = 7;

//Passwords are stored as scrypt hashes in user.password_hash, in the form scrypt$<saltHex>$<keyHex>.
//Seeded accounts start as plain text: checkPassword still accepts them, and the login actions
//replace them with a hash the first time they sign in.
const SCRYPT_KEY_BYTES = 64;
const SCRYPT_SALT_BYTES = 16;

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keyLength: number) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SCRYPT_SALT_BYTES);
  const key = await scryptAsync(password, salt, SCRYPT_KEY_BYTES);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

//True when the stored value is still plain text (seed data) and should be replaced with a hash
export function isPlainTextPassword(storedHash: string): boolean {
  return !storedHash.startsWith("scrypt$");
}

//Swaps a plain-text password for its hash after a successful login
export async function upgradePassword(userId: number, password: string): Promise<void> {
  await db.query("UPDATE user SET password_hash = ?, updated_by = ?, last_updated = NOW() WHERE user_id = ?", [
    await hashPassword(password),
    userId,
    userId,
  ]);
}

//True when the typed password matches what's stored in the db: a scrypt hash, or plain text from the seed data
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
  cookieStore.set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: keepLoggedIn ? SESSION_DAYS * 24 * 60 * 60 : undefined,
  });
}

export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
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
  const cookieStore = await cookies();
  return employeeFromSessionCookie(cookieStore.get(SESSION_COOKIE)?.value);
});

export async function employeeFromSessionCookie(value: string | undefined): Promise<SignedInEmployee | null> {
  const userId = userIdFromCookie(value);
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
}

async function readSessionUserId(): Promise<number | null> {
  // request time only: checking the cookie's expiry reads the clock, which can't happen while prerendering
  await connection();
  const cookieStore = await cookies();
  return userIdFromCookie(cookieStore.get(SESSION_COOKIE)?.value);
}

function userIdFromCookie(value: string | undefined): number | null {
  if (!value) return null;

  const [userId, expires, signature] = value.split(".");
  if (!userId || !expires || !signature) return null;

  const expected = Buffer.from(sign(`${userId}.${expires}`));
  const received = Buffer.from(signature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  if (Number(expires) * 1000 < Date.now()) return null;

  return Number(userId);
}

// HMAC of text with SESSION_SECRET, used for the session cookie and the trip lookup cookie
export function sign(text: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or shorter than 32 characters in .env.local. See .env.example for how to make one, then restart pnpm dev.",
    );
  }
  return createHmac("sha256", secret).update(text).digest("base64url");
}
