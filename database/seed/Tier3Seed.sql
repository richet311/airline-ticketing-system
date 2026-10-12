-- Tier 3: flights, fares, seats, bookings, upgrades, tickets, payments and baggage.

USE airline_db;

INSERT INTO flight (flight_id, flight_number, aircraft_id, origin_airport_id, destination_airport_id, departure_time, arrival_time, departure_gate_id, arrival_gate_id, flight_status_id, distance, created_by, created_at, updated_by, last_updated) VALUES
(50001, 'AZ101', 20001, 10001, 10002, '2026-12-15 07:00:00', '2026-12-15 16:00:00', 40002, 40003, 1, 6629, 1, NOW(), 1, NOW()),
(50002, 'AZ202', 20002, 10004, 10003, '2026-12-18 09:00:00', '2026-12-18 21:00:00', NULL, NULL, 1, 5837, 1, NOW(), 1, NOW()),
(50003, 'AZ303', 20003, 10003, 10005, '2026-12-20 12:00:00', '2026-12-20 13:15:00', NULL, NULL, 6, 348, 1, NOW(), 1, NOW());

INSERT INTO fare_class (fare_class_id, flight_id, cabin_class_id, base_price, seats_total, seats_available, is_refundable, change_fee, created_by, created_at, updated_by, last_updated) VALUES
(60001, 50001, 2, 653.00, 8, 7, TRUE, 75.00, 1, NOW(), 1, NOW()), -- 8 seats for flight 50001: seat 2A is ticketed and 7 remain
(60002, 50002, 1, 1200.00, 4, 0, FALSE, 100.00, 1, NOW(), 1, NOW()), -- 4 seats for flight 50002: sold out flight
(60003, 50003, 1, 300.00, 6, 5, FALSE, 25.00, 1, NOW(), 1, NOW()); -- 6 seats for flight 50003: edge case, seat 1A is ticketed but flight is cancelled

-- seat_status is reserved if it's nested in a confirmed/completed booking that's again nested in a ticket
INSERT INTO seat (flight_id, seat_number, cabin_class_id, seat_status_id, held_until, created_by, created_at, updated_by, last_updated) VALUES
(50001, '1A', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50001, '1B', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50001, '1C', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50001, '2A', 2, 3, NULL, 1, NOW(), 1, NOW()),
(50001, '2B', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50001, '2C', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50001, '3A', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50001, '3B', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50002, '1A', 1, 3, NULL, 1, NOW(), 1, NOW()),
(50002, '1B', 1, 3, NULL, 1, NOW(), 1, NOW()),
(50002, '2A', 1, 3, NULL, 1, NOW(), 1, NOW()),
(50002, '2B', 1, 3, NULL, 1, NOW(), 1, NOW()),
(50003, '1A', 1, 3, NULL, 1, NOW(), 1, NOW()),
(50003, '1B', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50003, '1C', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50003, '2A', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50003, '2B', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50003, '2C', 1, 1, NULL, 1, NOW(), 1, NOW());

-- booking total is the sum of the fare_class base price and any booking upgrades
INSERT INTO booking (booking_id, passenger_id, booking_status_id, total_amount, currency, expires_at, created_by, created_at, updated_by, last_updated) VALUES
('AZ42KQ', 1001, 2, 658.00, 'USD', NULL, 1, NOW(), 1, NOW()),
('AZ42KR', 1003, 2, 1200.00, 'USD', NULL, 1, NOW(), 1, NOW()),
('AZ42KS', 1004, 2, 300.00, 'USD', NULL, 1, NOW(), 1, NOW()),
('AZ42KT', 1001, 2, 315.00, 'USD', NULL, 1, NOW(), 1, NOW()),
('AZ42KU', 1003, 2, 1210.00, 'USD', NULL, 1, NOW(), 1, NOW()),
('AZ42KV', 1004, 3, 673.00, 'USD', NULL, 1, NOW(), 1, NOW());

INSERT INTO booking_upgrade (upgrade_id, booking_id, created_by, created_at, updated_by, last_updated) VALUES
(1, 'AZ42KQ', 1, NOW(), 1, NOW()),
(2, 'AZ42KT', 1, NOW(), 1, NOW()),
(3, 'AZ42KU', 1, NOW(), 1, NOW()),
(4, 'AZ42KV', 1, NOW(), 1, NOW());

-- flight fare is an attribute of ticket but we want to show the derived value on the ticket that is the total amount (the base price plus any booking upgrade)
INSERT INTO ticket (e_ticket_number, booking_id, passenger_id, flight_id, fare_class_id, seat_number, flight_fare, checked_in, created_by, created_at, updated_by, last_updated) VALUES
('A2345678B', 'AZ42KQ', 1001, 50001, 60001, '2A', 653.00, FALSE, 1, NOW(), 1, NOW()),
('B2345678C', 'AZ42KR', 1003, 50002, 60002, '1A', 1200.00, FALSE, 1, NOW(), 1, NOW()),
('C2345678D', 'AZ42KS', 1004, 50002, 60002, '1B', 300.00, FALSE, 1, NOW(), 1, NOW()),
('D2345678E', 'AZ42KT', 1001, 50002, 60002, '2A', 300.00, FALSE, 1, NOW(), 1, NOW()),
('E2345678F', 'AZ42KU', 1003, 50002, 60002, '2B', 1200.00, FALSE, 1, NOW(), 1, NOW()),
('F2345678G', 'AZ42KV', 1004, 50003, 60003, '1A', 300.00, FALSE, 1, NOW(), 1, NOW());

INSERT INTO payment (payment_id, booking_id, payment_status, total_amount, payment_method, idempotency_key, payment_time, created_by, created_at, updated_by, last_updated) VALUES
(70001, 'AZ42KQ', 'RECEIVED', 658.00, 'CREDIT', '9b1deb4d-3b7d-4bad-9b1d-bd7b7d7b7d01', '2026-10-10 22:00:00', 1, NOW(), 1, NOW()),
(70002, 'AZ42KR', 'RECEIVED', 1200.00, 'DEBIT', '9b1deb4d-3b7d-4bad-9b1d-bd7b7d7b7d02', '2026-10-11 10:00:00', 1, NOW(), 1, NOW()),
(70003, 'AZ42KS', 'RECEIVED', 300.00, 'CREDIT', '9b1deb4d-3b7d-4bad-9b1d-bd7b7b7b7d03', '2026-10-11 10:05:00', 1, NOW(), 1, NOW()),
(70004, 'AZ42KT', 'RECEIVED', 315.00, 'PAYPAL', '9b1deb4d-3b7d-4bad-9b1d-bd7b7b7b7d04', '2026-10-11 10:10:00', 1, NOW(), 1, NOW()),
(70005, 'AZ42KU', 'RECEIVED', 1210.00, 'DEBIT', '9b1deb4d-3b7d-4bad-9b1d-bd7b7b7b7d05', '2026-10-11 10:15:00', 1, NOW(), 1, NOW()),
(70006, 'AZ42KV', 'REFUNDED', 673.00, 'CREDIT', '9b1deb4d-3b7d-4bad-9b1d-bd7b7b7b7d06', '2026-10-12 09:00:00', 1, NOW(), 1, NOW());


INSERT INTO baggage (tag_number, e_ticket_number, weightage, baggage_status_id, fee, created_by, created_at, updated_by, last_updated) VALUES
('BG77765', 'A2345678B', 42.50, 1, 0.00, 1, NOW(), 1, NOW()),
('BG77766', 'B2345678C', 18.25, 4, 0.00, 1, NOW(), 1, NOW()),
('BG77767', 'C2345678D', 61.00, 2, 35.00, 1, NOW(), 1, NOW()),
('BG77768', 'F2345678G', 29.75, 5, 0.00, 1, NOW(), 1, NOW());
