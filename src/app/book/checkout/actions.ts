"use server";

import { randomInt } from "node:crypto";
import { redirect } from "next/navigation";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { bagFee, CHECKED_BAG_FEES } from "@/lib/baggageFees";
import { db } from "@/lib/db";
import type { FareOption, UpgradeType } from "@/lib/types";

//guests are saved as the system user for now
const SYSTEM_USER_ID = 1;

// "default weight" until the bag is weighed at the airport
const BOOKED_BAG_WEIGHT_LB = 50;

const MAX_PASSENGERS = 9;

const BOOKED = "(SELECT seat_status_id FROM seat_status WHERE seat_status_name = 'BOOKED')";
const CONFIRMED = "(SELECT booking_status_id FROM booking_status WHERE booking_status_name = 'CONFIRMED')";
const CHECKED = "(SELECT baggage_status_id FROM baggage_status WHERE baggage_status_name = 'CHECKED')";

export type PurchaseResult = { ok: false; error: string };

type Traveler = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber: string;
  passportExpiry: string;
  nationality: string;
  bags: number;
};

type Leg = { fare: FareOption; seats: string[] };

async function inTransaction<T>(work: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

class CheckoutError extends Error {}

export async function purchase(formData: FormData): Promise<PurchaseResult> {
  function text(name: string): string {
    return String(formData.get(name) ?? "").trim();
  }
  function list(name: string): string[] {
    return text(name) === "" ? [] : text(name).split(",");
  }

  const outbound = Number(text("outbound"));
  const returnFare = text("return") === "" ? null : Number(text("return"));
  const passengers = Number(text("passengers"));
  const outboundSeats = list("outbound_seats");
  const returnSeats = list("return_seats");
  const idempotencyKey = text("idempotency_key");
  const paymentMethod = text("payment_method");
  const upgradeIds = [...new Set(formData.getAll("upgrade").map(Number))].filter(Number.isInteger);

  if (!Number.isInteger(passengers) || passengers < 1 || passengers > MAX_PASSENGERS) {
    return { ok: false, error: "Something went wrong with your trip. Please start a new search." };
  }
  if (outboundSeats.length !== passengers || (returnFare !== null && returnSeats.length !== passengers)) {
    return { ok: false, error: "Every traveler needs a seat. Please choose your seats again." };
  }
  if (!/^[0-9a-f-]{36}$/.test(idempotencyKey)) {
    return { ok: false, error: "Please reload the page and try again." };
  }

  const travelers: Traveler[] = [];
  for (let i = 0; i < passengers; i++) {
    const traveler: Traveler = {
      firstName: text(`first_name_${i}`),
      lastName: text(`last_name_${i}`),
      dateOfBirth: text(`date_of_birth_${i}`),
      passportNumber: text(`passport_number_${i}`).toUpperCase(),
      passportExpiry: text(`passport_expiry_${i}`),
      nationality: text(`nationality_${i}`).toUpperCase(),
      bags: Number(text(`bags_${i}`)),
    };
    const error = checkTraveler(traveler, i + 1);
    if (error) return { ok: false, error };
    travelers.push(traveler);
  }
  // no duplicate passports
  const passports = travelers.map((t) => `${t.nationality}${t.passportNumber}`);
  if (new Set(passports).size !== passports.length) {
    return { ok: false, error: "Two travelers have the same passport. Each traveler needs their own." };
  }

  const paymentError = checkPayment(formData, paymentMethod);
  if (paymentError) return { ok: false, error: paymentError };

  const [paid] = await db.query<RowDataPacket[]>("SELECT booking_id FROM payment WHERE idempotency_key = ?", [
    idempotencyKey,
  ]);
  if (paid.length > 0) {
    redirect(`/book/confirmation?booking=${paid[0].booking_id}`);
  }

//prices are determined from the db
  const fareIds = returnFare === null ? [outbound] : [outbound, returnFare];
  const [fares] = await db.query<FareOption[]>(
    `SELECT fc.fare_class_id, fc.flight_id, cc.cabin_class_name,
            fc.base_price, fc.seats_available, fc.is_refundable
       FROM fare_class fc
       JOIN cabin_class cc ON cc.cabin_class_id = fc.cabin_class_id
      WHERE fc.fare_class_id IN (?)`,
    [fareIds],
  );
  const outboundFare = fares.find((fare) => fare.fare_class_id === outbound);
  const returnFareRow = fares.find((fare) => fare.fare_class_id === returnFare);
  if (!outboundFare || (returnFare !== null && !returnFareRow)) {
    return { ok: false, error: "That fare no longer exists. Please start a new search." };
  }
  const legs: Leg[] = [{ fare: outboundFare, seats: outboundSeats }];
  if (returnFareRow) {
    legs.push({ fare: returnFareRow, seats: returnSeats });
  }

  let upgrades: UpgradeType[] = [];
  if (upgradeIds.length > 0) {
    [upgrades] = await db.query<UpgradeType[]>("SELECT * FROM upgrade_type WHERE upgrade_id IN (?)", [upgradeIds]);
  }

  const fareTotal = legs.reduce((sum, leg) => sum + leg.fare.base_price * passengers, 0);
  const upgradeTotal = upgrades.reduce((sum, upgrade) => sum + upgrade.upgrade_price, 0);
  const bagTotal = travelers.reduce((sum, t) => sum + bagFee(t.bags), 0) * legs.length;
  const total = fareTotal + upgradeTotal + bagTotal;

  let bookingId: string;
  try {
    bookingId = await inTransaction(async (conn) => {
      for (const leg of legs) {
        await checkLeg(conn, leg);
      }

      const passengerIds: number[] = [];
      for (const traveler of travelers) {
        passengerIds.push(await findOrCreatePassenger(conn, traveler));
      }

      const newBookingId = await insertBooking(conn, passengerIds[0], total);

      let ticketCount = 0;
      let bagCount = 0;
      for (const leg of legs) {
        for (let i = 0; i < travelers.length; i++) {
          const ticketNumber = `${newBookingId}-${String(++ticketCount).padStart(2, "0")}`;
          await conn.query(
            `INSERT INTO ticket (e_ticket_number, booking_id, passenger_id, flight_id, fare_class_id,
                                 seat_number, flight_fare, checked_in, boarded,
                                 created_by, created_at, updated_by, last_updated)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, NOW(), ?, NOW())`,
            [
              ticketNumber,
              newBookingId,
              passengerIds[i],
              leg.fare.flight_id,
              leg.fare.fare_class_id,
              leg.seats[i],
              leg.fare.base_price,
              SYSTEM_USER_ID,
              SYSTEM_USER_ID,
            ],
          );

          for (let bag = 0; bag < travelers[i].bags; bag++) {
            const tagNumber = `BG${newBookingId}${String(++bagCount).padStart(2, "0")}`;
            await conn.query(
              `INSERT INTO baggage (tag_number, e_ticket_number, weightage, baggage_status_id, fee,
                                    created_by, created_at, updated_by, last_updated)
               VALUES (?, ?, ?, ${CHECKED}, ?, ?, NOW(), ?, NOW())`,
              [tagNumber, ticketNumber, BOOKED_BAG_WEIGHT_LB, CHECKED_BAG_FEES[bag], SYSTEM_USER_ID, SYSTEM_USER_ID],
            );
          }
        }
      }

      for (const upgrade of upgrades) {
        await conn.query(
          `INSERT INTO booking_upgrade (upgrade_id, booking_id, created_by, created_at, updated_by, last_updated)
           VALUES (?, ?, ?, NOW(), ?, NOW())`,
          [upgrade.upgrade_id, newBookingId, SYSTEM_USER_ID, SYSTEM_USER_ID],
        );
      }

      //card details aren't collected for the scope of our project
      await conn.query(
        `INSERT INTO payment (booking_id, payment_status, total_amount, payment_method, idempotency_key,
                              payment_time, created_by, created_at, updated_by, last_updated)
         VALUES (?, 'RECEIVED', ?, ?, ?, NOW(), ?, NOW(), ?, NOW())`,
        [newBookingId, total, paymentMethod, idempotencyKey, SYSTEM_USER_ID, SYSTEM_USER_ID],
      );

      return newBookingId;
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }

  redirect(`/book/confirmation?booking=${bookingId}`);
}

function checkTraveler(t: Traveler, n: number): string | null {
  const today = new Date().toISOString().slice(0, 10);
  const who = `Traveler ${n}`;

  if (t.firstName === "" || t.lastName === "") return `${who}: enter a first and last name.`;
  if (t.firstName.length > 50 || t.lastName.length > 50) return `${who}: names can be at most 50 characters.`;
  if (!isDate(t.dateOfBirth) || t.dateOfBirth >= today) return `${who}: enter a date of birth in the past.`;
  if (!/^[A-Z]{2}$/.test(t.nationality)) return `${who}: nationality is a 2-letter country code, like US.`;
  if (!/^[A-Z0-9]{8,9}$/.test(t.passportNumber)) return `${who}: a passport number is 8 or 9 letters and digits.`;
  if (!isDate(t.passportExpiry) || t.passportExpiry <= today) return `${who}: this passport has expired.`;
  if (!Number.isInteger(t.bags) || t.bags < 0 || t.bags > CHECKED_BAG_FEES.length) {
    return `${who}: choose 0 to ${CHECKED_BAG_FEES.length} checked bags.`;
  }
  return null;
}

function checkPayment(formData: FormData, method: string): string | null {
  if (!["CREDIT", "DEBIT", "PAYPAL"].includes(method)) return "Choose a payment method.";
  if (method === "PAYPAL") return null;

  const name = String(formData.get("card_name") ?? "").trim();
  const number = String(formData.get("card_number") ?? "").replace(/[\s-]/g, "");
  const expiry = String(formData.get("card_expiry") ?? "").trim();
  const cvc = String(formData.get("card_cvc") ?? "").trim();

  if (name === "") return "Enter the name on the card.";
  if (!/^\d{12,19}$/.test(number)) return "Enter a card number of 12 to 19 digits.";
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!match || Number(match[1]) < 1 || Number(match[1]) > 12) return "Enter the card's expiry as MM/YY.";
  const now = new Date();
  const expiresYear = 2000 + Number(match[2]);
  const expiresMonth = Number(match[1]);
  if (expiresYear < now.getUTCFullYear() || (expiresYear === now.getUTCFullYear() && expiresMonth < now.getUTCMonth() + 1)) {
    return "This card has expired.";
  }
  if (!/^\d{3,4}$/.test(cvc)) return "Enter the 3 or 4 digit security code.";
  return null;
}

function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

// Makes sure the flight can still be sold and locks its seats.
async function checkLeg(conn: PoolConnection, leg: Leg) {
  const [flights] = await conn.query<RowDataPacket[]>(
    `SELECT f.flight_number
       FROM flight f
       JOIN flight_status fs ON fs.flight_status_id = f.flight_status_id
      WHERE f.flight_id = ? AND f.departure_time > NOW() AND fs.flight_status_name IN ('SCHEDULED', 'DELAYED')`,
    [leg.fare.flight_id],
  );
  if (flights.length === 0) {
    throw new CheckoutError("One of your flights can no longer be booked. Please start a new search.");
  }

  // FOR UPDATE so two purchases can't take the same seats
  const [seats] = await conn.query<RowDataPacket[]>(
    `SELECT s.seat_number
       FROM seat s
       JOIN fare_class fc ON fc.flight_id = s.flight_id AND fc.cabin_class_id = s.cabin_class_id
      WHERE s.flight_id = ? AND s.seat_number IN (?) AND fc.fare_class_id = ? AND s.seat_status_id = ${BOOKED}
        FOR UPDATE`,
    [leg.fare.flight_id, leg.seats, leg.fare.fare_class_id],
  );
  if (seats.length !== new Set(leg.seats).size || seats.length !== leg.seats.length) {
    throw new CheckoutError(`Your seats on ${flights[0].flight_number} aren't reserved anymore. Please choose them again.`);
  }

  const [tickets] = await conn.query<RowDataPacket[]>(
    "SELECT e_ticket_number FROM ticket WHERE flight_id = ? AND seat_number IN (?)",
    [leg.fare.flight_id, leg.seats],
  );
  if (tickets.length > 0) {
    throw new CheckoutError(
      `Your seats on ${flights[0].flight_number} have already been purchased. Find the booking in My Trips.`,
    );
  }
}

// Reuses the passenger if the passport is already on file, otherwise adds a new one.
async function findOrCreatePassenger(conn: PoolConnection, t: Traveler): Promise<number> {
  const [existing] = await conn.query<RowDataPacket[]>(
    `SELECT passenger_id, first_name, last_name, date_of_birth
       FROM passenger
      WHERE nationality = ? AND passport_number = ?`,
    [t.nationality, t.passportNumber],
  );
  if (existing.length > 0) {
    const row = existing[0];
    // compare names case-insensitively
    const sameName =
      String(row.first_name).toLowerCase() === t.firstName.toLowerCase() &&
      String(row.last_name).toLowerCase() === t.lastName.toLowerCase();
    if (!sameName || row.date_of_birth !== t.dateOfBirth) {
      throw new CheckoutError(
        `Passport ${t.passportNumber} is on file under a different name or date of birth. Please check it.`,
      );
    }
    return row.passenger_id;
  }

  const [result] = await conn.query<ResultSetHeader>(
    `INSERT INTO passenger (user_id, passenger_parent_id, first_name, last_name, date_of_birth,
                            passport_number, passport_expiry_date, nationality,
                            created_by, created_at, updated_by, last_updated)
     VALUES (NULL, NULL, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`,
    [t.firstName, t.lastName, t.dateOfBirth, t.passportNumber, t.passportExpiry, t.nationality, SYSTEM_USER_ID, SYSTEM_USER_ID],
  );
  return result.insertId;
}

// Inserts the booking with a random code, retrying if the code is taken.
async function insertBooking(conn: PoolConnection, passengerId: number, total: number): Promise<string> {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "AZ";
    for (let i = 0; i < 4; i++) {
      code += characters[randomInt(characters.length)];
    }
    try {
      await conn.query(
        `INSERT INTO booking (booking_id, passenger_id, booking_status_id, total_amount, currency, expires_at,
                              created_by, created_at, updated_by, last_updated)
         VALUES (?, ?, ${CONFIRMED}, ?, 'USD', NULL, ?, NOW(), ?, NOW())`,
        [code, passengerId, total, SYSTEM_USER_ID, SYSTEM_USER_ID],
      );
      return code;
    } catch (error) {
      // code already taken, try another one
      if ((error as { code?: string }).code !== "ER_DUP_ENTRY") throw error;
    }
  }
  throw new Error("Couldn't find a free confirmation code.");
}
