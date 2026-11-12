import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { Connection } from "mysql2/promise";

import { db } from "@/lib/db";
import { POINTS_PER_DOLLAR, pointsEarned } from "@/lib/rewardPoints";
import type { LoyaltyTier, PointsActivity } from "@/lib/types";

// Azure Rewards: tiers, points history, earnings

// lowest spend first
export async function getTiers(): Promise<LoyaltyTier[]> {
  const [tiers] = await db.query<LoyaltyTier[]>(
    `SELECT tier_id, tier_name, min_qualifying_spend, bonus_percent, free_bags,
            upgrade_discount_percent, priority_boarding, free_seat_choice
       FROM loyalty_tier
      ORDER BY min_qualifying_spend`,
  );
  return tiers;
}

// what the user spent in the last 12 months (refunds count as negative)
export async function getQualifyingSpend(userId: number): Promise<number> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(qualifying_spend), 0) AS spend
       FROM points_transaction
      WHERE user_id = ? AND created_at >= NOW() - INTERVAL 12 MONTH`,
    [userId],
  );
  return Math.max(0, Number(rows[0].spend));
}

// the highest tier the spend reaches
export function tierFor(spend: number, tiers: LoyaltyTier[]): LoyaltyTier {
  let tier = tiers[0];
  for (const t of tiers) {
    if (spend >= t.min_qualifying_spend) tier = t;
  }
  return tier;
}

// null when already on the top tier
export function nextTier(tier: LoyaltyTier, tiers: LoyaltyTier[]): LoyaltyTier | null {
  const index = tiers.findIndex((t) => t.tier_id === tier.tier_id);
  return index < tiers.length - 1 ? tiers[index + 1] : null;
}

// $248 at Silver (+25%) -> 1550
export function pointsForPayment(amount: number, tier: LoyaltyTier): number {
  return pointsEarned(amount, tier.bonus_percent);
}

// newest first
export async function getRecentActivity(userId: number, limit = 6): Promise<PointsActivity[]> {
  const [rows] = await db.query<PointsActivity[]>(
    `SELECT transaction_id, booking_id, transaction_type, points, description, created_at
       FROM points_transaction
      WHERE user_id = ?
      ORDER BY created_at DESC, transaction_id DESC
      LIMIT ?`,
    [userId, limit],
  );
  return rows;
}

// Gives the booker points for a paid booking.
// Returns the points added, or 0 if there was nothing to add.
export async function awardPoints(bookingId: string, updatedBy: number): Promise<number> {
  const [payments] = await db.query<RowDataPacket[]>(
    `SELECT pay.total_amount, p.user_id
       FROM payment pay
       JOIN booking b   ON b.booking_id = pay.booking_id
       JOIN passenger p ON p.passenger_id = b.passenger_id
      WHERE pay.booking_id = ? AND pay.payment_status = 'RECEIVED'`,
    [bookingId],
  );
  const payment = payments[0];
  // guest booking or not paid
  if (!payment || payment.user_id === null) return 0;

  const tier = tierFor(await getQualifyingSpend(payment.user_id), await getTiers());
  const points = pointsForPayment(payment.total_amount, tier);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // lock the user row so two payments can't update the balance at once
    await conn.query("SELECT loyalty_points FROM user WHERE user_id = ? FOR UPDATE", [payment.user_id]);
    // unique_booking_transaction makes a second EARN for the same booking fail
    await conn.query<ResultSetHeader>(
      `INSERT INTO points_transaction (user_id, booking_id, transaction_type, points, qualifying_spend, description,
                                       created_by, created_at, updated_by, last_updated)
       VALUES (?, ?, 'EARN', ?, ?, ?, ?, NOW(), ?, NOW())`,
      [payment.user_id, bookingId, points, payment.total_amount, `Booking ${bookingId}`, updatedBy, updatedBy],
    );
    await conn.query(
      "UPDATE user SET loyalty_points = loyalty_points + ?, updated_by = ?, last_updated = NOW() WHERE user_id = ?",
      [points, updatedBy, payment.user_id],
    );
    await conn.commit();
    return points;
  } catch (error) {
    await conn.rollback();
    // already credited
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") return 0;
    throw error;
  } finally {
    conn.release();
  }
}

// When a booking is cancelled: takes back the points it earned and gives back the points spent on its upgrades.
// Run inside the cancel's transaction. Saved as one REFUND row. Never takes the balance below 0.
export async function refundPoints(conn: Connection, bookingId: string, updatedBy: number): Promise<number> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT pt.user_id, pt.transaction_type, pt.points, pt.qualifying_spend, u.loyalty_points
       FROM points_transaction pt
       JOIN user u ON u.user_id = pt.user_id
      WHERE pt.booking_id = ? AND pt.transaction_type IN ('EARN', 'REDEEM')
        FOR UPDATE`,
    [bookingId],
  );
  if (rows.length === 0) return 0;
  const earn = rows.find((row) => row.transaction_type === "EARN");
  const redeem = rows.find((row) => row.transaction_type === "REDEEM");

  const spentBack = redeem ? -Number(redeem.points) : 0;
  const earnedBack = earn ? Math.min(Number(earn.points), Number(rows[0].loyalty_points) + spentBack) : 0;
  const change = spentBack - earnedBack;
  const spend = earn ? -Number(earn.qualifying_spend) : 0;
  // unique_booking_transaction stops a second REFUND for the same booking
  await conn.query(
    `INSERT INTO points_transaction (user_id, booking_id, transaction_type, points, qualifying_spend, description,
                                     created_by, created_at, updated_by, last_updated)
     VALUES (?, ?, 'REFUND', ?, ?, ?, ?, NOW(), ?, NOW())`,
    [rows[0].user_id, bookingId, change, spend, `Cancelled booking ${bookingId}`, updatedBy, updatedBy],
  );
  await conn.query(
    "UPDATE user SET loyalty_points = loyalty_points + ?, updated_by = ?, last_updated = NOW() WHERE user_id = ?",
    [change, updatedBy, rows[0].user_id],
  );
  return change;
}

// Pays for upgrades with points: saves a REDEEM row and lowers the balance. Run inside the purchase's transaction.
export async function redeemPoints(conn: Connection, userId: number, bookingId: string, points: number, updatedBy: number) {
  const [users] = await conn.query<RowDataPacket[]>("SELECT loyalty_points FROM user WHERE user_id = ? FOR UPDATE", [userId]);
  if (users.length === 0 || Number(users[0].loyalty_points) < points) return false;

  await conn.query(
    `INSERT INTO points_transaction (user_id, booking_id, transaction_type, points, qualifying_spend, description,
                                     created_by, created_at, updated_by, last_updated)
     VALUES (?, ?, 'REDEEM', ?, 0, ?, ?, NOW(), ?, NOW())`,
    [userId, bookingId, -points, `Upgrades on booking ${bookingId}`, updatedBy, updatedBy],
  );
  await conn.query(
    "UPDATE user SET loyalty_points = loyalty_points - ?, updated_by = ?, last_updated = NOW() WHERE user_id = ?",
    [points, updatedBy, userId],
  );
  return true;
}

// "SILVER" -> "Silver"
export function tierLabel(name: string): string {
  return name.charAt(0) + name.slice(1).toLowerCase();
}

// the perks a tier shows on the page
export function tierPerks(tier: LoyaltyTier): string[] {
  const perks = [
    tier.bonus_percent > 0 ? `${tier.bonus_percent}% bonus points` : `${POINTS_PER_DOLLAR} points per $1`,
  ];
  if (tier.free_bags > 0) perks.push(tier.free_bags === 1 ? "2nd checked bag free" : `${tier.free_bags} extra free checked bags`);
  if (tier.priority_boarding) perks.push("Priority boarding");
  if (tier.upgrade_discount_percent > 0) perks.push(`${tier.upgrade_discount_percent}% off upgrades`);
  if (tier.free_seat_choice) perks.push("Free seat choice");
  return perks;
}
