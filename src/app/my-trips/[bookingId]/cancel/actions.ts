"use server";

import { redirect } from "next/navigation";

import { cancellationRefund, cancelProblem, roundCents } from "@/lib/bookingRules";
import { refundPoints } from "@/lib/rewards";
import { getCurrentUser } from "@/lib/session";
import { withTransaction } from "@/lib/transaction";
import { addPayment, AVAILABLE, getTrip, lockBooking, recountSeats } from "@/lib/trips";
import type { TripActionState } from "@/lib/types";

// guests are saved as the system user for now
const SYSTEM_USER_ID = 1;

class Refused extends Error {}

// Cancels the whole booking: seats go back to AVAILABLE, everything paid is refunded with a REFUNDED
// payment row, and the points it earned are taken back. Rows are never deleted.
export async function cancelTrip(previousState: TripActionState, formData: FormData): Promise<TripActionState> {
  const bookingId = String(formData.get("booking_id") ?? "").trim().toUpperCase();
  const userId = (await getCurrentUser())?.user_id ?? SYSTEM_USER_ID;

  try {
    await withTransaction(async (conn) => {
      await lockBooking(conn, bookingId);
      const trip = await getTrip(bookingId, conn);
      if (!trip) throw new Refused("We couldn't find this trip.");

      const problem = cancelProblem(trip.booking.booking_status_name, trip.legs.map((leg) => leg.tickets));
      if (problem) throw new Refused(problem);

      await conn.query(
        `UPDATE seat s JOIN ticket t ON t.flight_id = s.flight_id AND t.seat_number = s.seat_number
            SET s.seat_status_id = ${AVAILABLE}, s.held_until = NULL, s.updated_by = ?, s.last_updated = NOW()
          WHERE t.booking_id = ?`,
        [userId, bookingId],
      );
      await conn.query("UPDATE ticket SET seat_number = NULL, updated_by = ?, last_updated = NOW() WHERE booking_id = ?", [
        userId,
        bookingId,
      ]);

      const paid = trip.booking.paid_amount;
      const refund = cancellationRefund(paid);
      await conn.query(
        `UPDATE booking
            SET booking_status_id = (SELECT booking_status_id FROM booking_status WHERE booking_status_name = 'CANCELLED'),
                total_amount = ?, expires_at = NULL, updated_by = ?, last_updated = NOW()
          WHERE booking_id = ?`,
        [roundCents(paid - refund), userId, bookingId],
      );
      if (refund > 0) await addPayment(conn, bookingId, "REFUNDED", refund, userId);

      await refundPoints(conn, bookingId, userId);
      for (const leg of trip.legs) await recountSeats(conn, leg.flight.flight_id);
    });
  } catch (error) {
    if (error instanceof Refused) return { error: error.message };
    throw error;
  }

  redirect(`/my-trips/${bookingId}?done=cancelled`);
}
