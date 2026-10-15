// Status and code values. Not written yet: this file only describes what goes here.
// The status and code tables use IDs typed by hand in the seed files. Don't write those
// numbers (2, 3, ...) directly in pages and actions: nobody can tell what they mean, and they
// break silently if the seeds change.
//
// Pick one way as a team, and use it everywhere:
// - By name in SQL, like the check-in example:
//     JOIN booking_status s ON s.booking_status_id = b.booking_status_id
//     WHERE s.booking_status_name = 'CONFIRMED'
// - Or one constant per value in this file, for example BOOKING_STATUS.CONFIRMED = 2, so a
//   typo is a TypeScript error instead of a wrong result.
//
// Current values (update this list whenever the seed files change):
// Tier1Seed.sql
// - booking_status:     1 PENDING, 2 CONFIRMED, 3 CANCELLED
// - seat_status:        1 AVAILABLE, 2 HELD, 3 BOOKED, 4 BLOCKED
// - flight_status:      1 SCHEDULED, 2 DELAYED, 3 BOARDING, 4 DEPARTED, 5 ARRIVED, 6 CANCELLED
// - baggage_status:     1 CHECKED, 2 LOADED, 3 IN TRANSIT (with a space), 4 ARRIVED, 5 LOST
// - gate_status:        1 AVAILABLE, 2 OCCUPIED, 3 MAINTENANCE
// - maintenance_status: 1 OPERATIONAL, 2 MAINTENANCE, 3 GROUNDED
// - cabin_class:        1 ECONOMY, 2 PREMIUM, 3 BUSINESS, 4 FIRST
// Tier2Seed.sql
// - job_role: 91 System Administrator, 92 Operations Manager, 93 Airplane Pilot,
//   94 Flight attendant, 95 Customer Service Agent, 96 Gate Agent, 97 Tarmac Agent
//   (permission checks in session.ts and the employee actions depend on these)
// schema.sql (CHECK rules on payment, not tables, so these are text, not IDs)
// - payment.payment_status: PENDING, RECEIVED, REFUNDED
// - payment.payment_method: CREDIT, DEBIT, PAYPAL
//
// Seat holds: a HELD seat whose held_until has passed should count as AVAILABLE again.
// Nothing resets it automatically, so every query that looks for free seats must allow for it,
// and the action that releases it also sets the matching ticket's seat_number to NULL.
// Compare held_until with NOW() in the website's queries: db.ts makes NOW() UTC.
