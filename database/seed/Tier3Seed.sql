-- Seed data, Tier 3: flights, fares, seats, bookings, upgrades, tickets,
-- payments, baggage. Needs Tiers 0 to 2 (passengers, aircraft, gates, statuses).
-- Run order: Tier0 > Tier1 > Tier2 > Tier3. Seed data rules: see the top of Tier0Seed.sql.

USE airline_db;

INSERT INTO flight (flight_id, flight_number, aircraft_id, origin_airport_id, destination_airport_id, departure_time, arrival_time, departure_gate_id, arrival_gate_id, flight_status_id, distance, created_by, created_at, updated_by, last_updated) VALUES
(1, 'AZ101', 1, 1, 2, '2026-12-15 07:00:00', '2026-12-15 16:00:00', 2, 3, 1, 6629, 1, NOW(), 1, NOW());

INSERT INTO fare_class (fare_class_id, flight_id, cabin_class_id, base_price, seats_total, seats_available, is_refundable, change_fee, created_by, created_at, updated_by, last_updated) VALUES
(801, 1, 2, 653.00, 8, 7, FALSE, 75.00, 1, NOW(), 1, NOW());

-- seat_status is reserved if it's nested in a confirmed/completed booking that's again nested in a ticket
INSERT INTO seat (flight_id, seat_number, cabin_class_id, seat_status_id, held_until, created_by, created_at, updated_by, last_updated) VALUES
(1, '2A', 2, 3, NULL, 1, NOW(), 1, NOW());

-- booking total is the sum of the fare_class base price and any booking upgrades
INSERT INTO booking (booking_id, passenger_id, booking_status_id, total_amount, currency, expires_at, created_by, created_at, updated_by, last_updated) VALUES
('AZ42KQ', 1001, 2, 688.00, 'USD', NULL, 1, NOW(), 1, NOW());

-- Not sure why we need booking_upgrade and comfort_upgrade_type. I think they are the same thing. We don't need to give a relationship between them two either, just one of them to the booking
INSERT INTO booking_upgrade (booking_upgrade_id, booking_id, upgrade_id, quantity, unit_price, created_by, created_at, updated_by, last_updated) VALUES
(1, 'AZ42KQ', 1, 1, 35.00, 1, NOW(), 1, NOW());

-- we will need to change flight fare to total_amount, makes no sense not to include the add-ons as part of pricing shown on the ticket
INSERT INTO ticket (e_ticket_number, booking_id, passenger_id, flight_id, fare_class_id, seat_number, flight_fare, checked_in, created_by, created_at, updated_by, last_updated) VALUES
('A2345678B', 'AZ42KQ', 1001, 1, 801, '2A', 653.00, FALSE, 1, NOW(), 1, NOW());

-- payment type is redundant I feel like
-- payment method needs restrictions to check either Credit Card/Debit Card/PayPal
-- payment status needs restrictions to check Pending/Received
INSERT INTO payment (payment_id, booking_id, payment_type, payment_status, total_amount, payment_method, idempotency_key, payment_time, created_by, created_at, updated_by, last_updated) VALUES
(1, 'AZ42KQ', 'CREDIT', 'RECEIVED', 688.00, 'CREDIT', '9b1deb4d-3b7d-4bal', '2026-10-10 22:00:00', 1, NOW(), 1, NOW());

INSERT INTO baggage (tag_number, e_ticket_number, weightage, baggage_status_id, fee, created_by, created_at, updated_by, last_updated) VALUES
('BG77765', 'A2345678B', 42.50, 1, 0.00, 1, NOW(), 1, NOW());
