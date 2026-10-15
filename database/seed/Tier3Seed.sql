-- Seed data, Tier 3: flights, fares, seats, bookings, upgrades, tickets,
-- payments, baggage. Needs Tiers 0 to 2 (passengers, aircraft, gates, statuses).
-- Run order: Tier0 > Tier1 > Tier2 > Tier3. Seed data rules: see the top of Tier0Seed.sql.

-- STORY "NOW": the moment you run this file, rounded up to the next quarter hour (@now below).
--   Every flight time is set relative to it, so the flight statuses match the clock right after a
--   reset. They drift as real time passes (an hour later, "boarding" AZ640 has really left), so run
--   Tier 0 to 3 again before you test or demo anything that depends on the time.
-- TIMES: all UTC (team rule 6 in schema.sql). This file sets its MySQL session to UTC, so NOW() is
--   UTC here too. Pages convert with airport.timezone to show local time.
--   (Stored local, a westbound flight would "arrive before it departs" and fail check_flight_times.)
--   DISTANCES are in miles.
--
-- WHAT EACH PIECE DEMONSTRATES
--   Round trip B  AZ410 6 days ago / AZ411 in 15 days (IAH-ORD): parent + child, outbound flown, return ahead.
--   Round trip A  AZ101 in 63 days / AZ102 in 84 days (IAH-NRT): US to Japan and back, premium, parent + child.
--   Round trip E  AZ310 in 23 days / AZ311 in 38 days (IAH-JFK): premium booking confirmed; economy booking
--                 PENDING with both seats HELD and no payment. Return fares are similar but not equal.
--   PENDING       AZ43AC (no payment yet) and AZ43AD (payment PENDING). HELD seats expire 15 minutes
--                 after the seed runs. The ticket row is the only link between a booking and its seat.
--   BLOCKED       AZ310 seat 3B.
--   SOLD OUT      AZ640, which is also BOARDING (everyone checked in).
--   DEPARTED      AZ320, business and economy fares on one flight.
--   CHECK-IN      AZ350 departs in under 24 h: one passenger checked in, one not.
--   DELAYED       AZ301: nobody is checked in (check-in is closed while a flight is delayed).
--   CANCELLED     AZ303: AZ42KV already REFUNDED, and its seat released (ticket seat_number NULL);
--                 AZ42KU is still RECEIVED, so a refund is owed.
--   BAGGAGE       All five statuses, each on a flight that can really have it.
--
-- PRICING RULE
--   ticket.flight_fare = fare_class.base_price for that ticket.
--   booking.total_amount = sum of its tickets' flight_fare + sum of its upgrade_type prices.
--   payment.total_amount = booking.total_amount.
--   fare_class.seats_available = seats of that cabin with status AVAILABLE (HELD and BLOCKED excluded).

USE airline_db;

-- Team rule 6: everything is UTC. From here on, NOW() in this file is UTC as well.
SET time_zone = '+00:00';

-- The story's "now": the current UTC time rounded up to the next quarter hour, so flight times
-- land on round minutes. Every departure below is an offset from it:
--   @now - INTERVAL '6 4:30' DAY_MINUTE  = 6 days, 4 hours and 30 minutes before now
--   @now + INTERVAL '0:35' HOUR_MINUTE   = 35 minutes after now
-- and every arrival is its departure plus the flight's duration.
SET @now = TIMESTAMP(DATE(UTC_TIMESTAMP()), SEC_TO_TIME(CEIL(TIME_TO_SEC(TIME(UTC_TIMESTAMP())) / 900) * 900));

SET @az410 = @now - INTERVAL '6 4:30' DAY_MINUTE;    -- ARRIVED: left 6 days ago
SET @az320 = @now - INTERVAL '1:30' HOUR_MINUTE;     -- DEPARTED: left 1.5 hours ago, still in the air
SET @az640 = @now + INTERVAL '0:35' HOUR_MINUTE;     -- BOARDING: leaves in 35 minutes
SET @az301 = @now + INTERVAL '17:30' HOUR_MINUTE;    -- DELAYED: new time, 3.5 hours later than planned
SET @az350 = @now + INTERVAL '20:20' HOUR_MINUTE;    -- SCHEDULED: leaves in under 24 h, so check-in is open
SET @az411 = @now + INTERVAL '15 6:00' DAY_MINUTE;   -- SCHEDULED
SET @az310 = @now + INTERVAL '23 20:10' DAY_MINUTE;  -- SCHEDULED
SET @az311 = @now + INTERVAL '38 5:45' DAY_MINUTE;   -- SCHEDULED
SET @az101 = @now + INTERVAL '63 20:00' DAY_MINUTE;  -- SCHEDULED
SET @az303 = @now + INTERVAL '68 19:00' DAY_MINUTE;  -- CANCELLED
SET @az102 = @now + INTERVAL '84 10:30' DAY_MINUTE;  -- SCHEDULED

INSERT INTO flight (flight_id, flight_number, aircraft_id, origin_airport_id, destination_airport_id, departure_time, arrival_time, departure_gate_id, arrival_gate_id, flight_status_id, distance, created_by, created_at, updated_by, last_updated) VALUES
(50001, 'AZ410', 20004, 10001, 10007, @az410, @az410 + INTERVAL '2:25' HOUR_MINUTE, 40001, 40010, 5, 925, 1, NOW(), 1, NOW()), -- AZ410 IAH -> ORD | ARRIVED | Round trip B, outbound already flown
(50002, 'AZ320', 20005, 10001, 10006, @az320, @az320 + INTERVAL '3:20' HOUR_MINUTE, 40002, 40009, 4, 1379, 1, NOW(), 1, NOW()), -- AZ320 IAH -> LAX | DEPARTED | One way, in the air
(50003, 'AZ640', 20002, 10008, 10004, @az640, @az640 + INTERVAL '8:30' HOUR_MINUTE, 40011, 40007, 3, 3851, 1, NOW(), 1, NOW()), -- AZ640 FRA  -> JFK | BOARDING | SOLD OUT, everyone checked in
(50004, 'AZ350', 20007, 10007, 10006, @az350, @az350 + INTERVAL '4:30' HOUR_MINUTE, 40010, 40009, 1, 1745, 1, NOW(), 1, NOW()), -- AZ350 ORD -> LAX | SCHEDULED | Departs in under 24 h: check-in is open
(50005, 'AZ301', 20003, 10005, 10003, @az301, @az301 + INTERVAL '1:15' HOUR_MINUTE, 40008, NULL, 2, 215, 1, NOW(), 1, NOW()), -- AZ301 CDG -> LHR | DELAYED | Originally 3.5 h earlier. Check-in closed
(50006, 'AZ411', 20004, 10007, 10001, @az411, @az411 + INTERVAL '2:40' HOUR_MINUTE, NULL, NULL, 1, 925, 1, NOW(), 1, NOW()), -- AZ411 ORD -> IAH | SCHEDULED | Round trip B, return
(50007, 'AZ310', 20001, 10001, 10004, @az310, @az310 + INTERVAL '3:15' HOUR_MINUTE, NULL, NULL, 1, 1416, 1, NOW(), 1, NOW()), -- AZ310 IAH -> JFK | SCHEDULED | Round trip E, outbound. Has HELD and BLOCKED seats
(50008, 'AZ311', 20001, 10004, 10001, @az311, @az311 + INTERVAL '3:40' HOUR_MINUTE, NULL, NULL, 1, 1416, 1, NOW(), 1, NOW()), -- AZ311 JFK -> IAH | SCHEDULED | Round trip E, return. Has a HELD seat
(50009, 'AZ303', 20003, 10003, 10005, @az303, @az303 + INTERVAL '1:20' HOUR_MINUTE, NULL, NULL, 6, 215, 1, NOW(), 1, NOW()), -- AZ303 LHR -> CDG | CANCELLED | Refunds: see bookings AZ42KU and AZ42KV
(50010, 'AZ101', 20001, 10001, 10002, @az101, @az101 + INTERVAL '13:30' HOUR_MINUTE, 40002, 40003, 1, 6629, 1, NOW(), 1, NOW()), -- AZ101 IAH -> NRT | SCHEDULED | Round trip A, outbound (US to Japan)
(50011, 'AZ102', 20001, 10002, 10001, @az102, @az102 + INTERVAL '11:30' HOUR_MINUTE, NULL, NULL, 1, 6629, 1, NOW(), 1, NOW()); -- AZ102 NRT -> IAH | SCHEDULED | Round trip A, return (Japan to US)

INSERT INTO fare_class (fare_class_id, flight_id, cabin_class_id, base_price, seats_total, seats_available, is_refundable, change_fee, created_by, created_at, updated_by, last_updated) VALUES
(60001, 50001, 1, 189.00, 4, 2, FALSE, 50.00, 1, NOW(), 1, NOW()), -- AZ410 ECONOMY: 2 of 4 seats available
(60002, 50002, 3, 640.00, 2, 1, TRUE, 100.00, 1, NOW(), 1, NOW()), -- AZ320 BUSINESS: 1 of 2 seats available
(60003, 50002, 1, 229.00, 4, 3, FALSE, 50.00, 1, NOW(), 1, NOW()), -- AZ320 ECONOMY: 3 of 4 seats available
(60004, 50003, 1, 695.00, 4, 0, FALSE, 100.00, 1, NOW(), 1, NOW()), -- AZ640 ECONOMY: 0 of 4 seats available
(60005, 50004, 1, 215.00, 4, 2, FALSE, 50.00, 1, NOW(), 1, NOW()), -- AZ350 ECONOMY: 2 of 4 seats available
(60006, 50005, 1, 289.00, 6, 5, FALSE, 25.00, 1, NOW(), 1, NOW()), -- AZ301 ECONOMY: 5 of 6 seats available
(60007, 50006, 1, 195.00, 4, 2, FALSE, 50.00, 1, NOW(), 1, NOW()), -- AZ411 ECONOMY: 2 of 4 seats available
(60008, 50007, 2, 410.00, 2, 1, TRUE, 60.00, 1, NOW(), 1, NOW()), -- AZ310 PREMIUM: 1 of 2 seats available
(60009, 50007, 1, 248.00, 6, 3, FALSE, 50.00, 1, NOW(), 1, NOW()), -- AZ310 ECONOMY: 3 of 6 seats available
(60010, 50008, 2, 395.00, 2, 1, TRUE, 60.00, 1, NOW(), 1, NOW()), -- AZ311 PREMIUM: 1 of 2 seats available
(60011, 50008, 1, 259.00, 6, 5, FALSE, 50.00, 1, NOW(), 1, NOW()), -- AZ311 ECONOMY: 5 of 6 seats available
(60012, 50009, 1, 300.00, 6, 5, FALSE, 25.00, 1, NOW(), 1, NOW()), -- AZ303 ECONOMY: 5 of 6 seats available (AZ42KV's seat was released)
(60013, 50010, 2, 653.00, 8, 6, TRUE, 75.00, 1, NOW(), 1, NOW()), -- AZ101 PREMIUM: 6 of 8 seats available
(60014, 50011, 2, 641.00, 8, 6, TRUE, 75.00, 1, NOW(), 1, NOW()); -- AZ102 PREMIUM: 6 of 8 seats available

-- seat_status is reserved if it's nested in a confirmed/completed booking that's again nested in a ticket
INSERT INTO seat (flight_id, seat_number, cabin_class_id, seat_status_id, held_until, created_by, created_at, updated_by, last_updated) VALUES
(50001, '1A', 1, 3, NULL, 1, NOW(), 1, NOW()),
(50001, '1B', 1, 3, NULL, 1, NOW(), 1, NOW()),
(50001, '2A', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50001, '2B', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50002, '1A', 3, 3, NULL, 1, NOW(), 1, NOW()),
(50002, '1B', 3, 1, NULL, 1, NOW(), 1, NOW()),
(50002, '1C', 1, 3, NULL, 1, NOW(), 1, NOW()),
(50002, '2A', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50002, '2B', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50002, '2C', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50003, '1A', 1, 3, NULL, 1, NOW(), 1, NOW()),
(50003, '1B', 1, 3, NULL, 1, NOW(), 1, NOW()),
(50003, '2A', 1, 3, NULL, 1, NOW(), 1, NOW()),
(50003, '2B', 1, 3, NULL, 1, NOW(), 1, NOW()),
(50004, '1A', 1, 3, NULL, 1, NOW(), 1, NOW()),
(50004, '1B', 1, 3, NULL, 1, NOW(), 1, NOW()),
(50004, '2A', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50004, '2B', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50005, '1A', 1, 3, NULL, 1, NOW(), 1, NOW()),
(50005, '1B', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50005, '1C', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50005, '2A', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50005, '2B', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50005, '2C', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50006, '1A', 1, 3, NULL, 1, NOW(), 1, NOW()),
(50006, '1B', 1, 3, NULL, 1, NOW(), 1, NOW()),
(50006, '2A', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50006, '2B', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50007, '1A', 2, 3, NULL, 1, NOW(), 1, NOW()),
(50007, '1B', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50007, '1C', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50007, '2A', 1, 2, DATE_ADD(NOW(), INTERVAL 15 MINUTE), 1, NOW(), 1, NOW()), -- As soon as you run the seed, this HELD seat will expire in 10 minutes
(50007, '2B', 1, 2, DATE_ADD(NOW(), INTERVAL 15 MINUTE), 1, NOW(), 1, NOW()), -- This mirrors our business constraint on holding seats during checkout
(50007, '2C', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50007, '3A', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50007, '3B', 1, 4, NULL, 1, NOW(), 1, NOW()),
(50008, '1A', 2, 3, NULL, 1, NOW(), 1, NOW()),
(50008, '1B', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50008, '1C', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50008, '2A', 1, 2, DATE_ADD(NOW(), INTERVAL 15 MINUTE), 1, NOW(), 1, NOW()),
(50008, '2B', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50008, '2C', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50008, '3A', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50008, '3B', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50009, '1A', 1, 1, NULL, 1, NOW(), 1, NOW()), -- AVAILABLE again: AZ42KV was cancelled and its ticket gave up this seat
(50009, '1B', 1, 3, NULL, 1, NOW(), 1, NOW()),
(50009, '1C', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50009, '2A', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50009, '2B', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50009, '2C', 1, 1, NULL, 1, NOW(), 1, NOW()),
(50010, '1A', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50010, '1B', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50010, '1C', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50010, '2A', 2, 3, NULL, 1, NOW(), 1, NOW()),
(50010, '2B', 2, 3, NULL, 1, NOW(), 1, NOW()),
(50010, '2C', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50010, '3A', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50010, '3B', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50011, '1A', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50011, '1B', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50011, '1C', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50011, '2A', 2, 3, NULL, 1, NOW(), 1, NOW()),
(50011, '2B', 2, 3, NULL, 1, NOW(), 1, NOW()),
(50011, '2C', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50011, '3A', 2, 1, NULL, 1, NOW(), 1, NOW()),
(50011, '3B', 2, 1, NULL, 1, NOW(), 1, NOW());


-- booking total = (base price x number of tickets) + the price of each booking upgrade
INSERT INTO booking (booking_id, passenger_id, booking_status_id, total_amount, currency, expires_at, created_by, created_at, updated_by, last_updated) VALUES
('AZ42KU', 1003, 2, 320.00, 'USD', NULL, 1, NOW(), 1, NOW()), -- Flight cancelled, REFUND STILL OWED
('AZ42KV', 1004, 3, 300.00, 'USD', NULL, 1, NOW(), 1, NOW()), -- Flight cancelled, already refunded
('AZ43AA', 1005, 2, 778.00, 'USD', NULL, 1, NOW(), 1, NOW()), -- Round trip B, parent + child, outbound flown
('AZ43AB', 1007, 2, 810.00, 'USD', NULL, 1, NOW(), 1, NOW()), -- Round trip E, premium
('AZ43AC', 1005, 1, 507.00, 'USD', DATE_ADD(NOW(), INTERVAL 15 MINUTE), 1, NOW(), 1, NOW()), -- PENDING round trip E: choosing seats, no payment yet
('AZ43AD', 1013, 1, 258.00, 'USD', DATE_ADD(NOW(), INTERVAL 15 MINUTE), 1, NOW(), 1, NOW()), -- PENDING one way: at the payment step
('AZ43AE', 1008, 2, 650.00, 'USD', NULL, 1, NOW(), 1, NOW()), -- One way, business
('AZ43AF', 1014, 2, 249.00, 'USD', NULL, 1, NOW(), 1, NOW()), -- One way, economy
('AZ43AG', 1009, 2, 1395.00, 'USD', NULL, 1, NOW(), 1, NOW()), -- Two travelers, one booking
('AZ43AH', 1011, 2, 1400.00, 'USD', NULL, 1, NOW(), 1, NOW()), -- Two travelers, one booking
('AZ43AI', 1013, 2, 215.00, 'USD', NULL, 1, NOW(), 1, NOW()), -- Already checked in
('AZ43AJ', 1003, 2, 230.00, 'USD', NULL, 1, NOW(), 1, NOW()), -- Check-in open, not yet done
('AZ43AK', 1004, 2, 289.00, 'USD', NULL, 1, NOW(), 1, NOW()), -- Delayed flight, not checked in
('AZ42KQ', 1001, 2, 2593.00, 'USD', NULL, 1, NOW(), 1, NOW()); -- Round trip A, US to Japan and back, parent + child

INSERT INTO booking_upgrade (upgrade_id, booking_id, created_by, created_at, updated_by, last_updated) VALUES
(4, 'AZ42KU', 1, NOW(), 1, NOW()),
(3, 'AZ43AA', 1, NOW(), 1, NOW()),
(1, 'AZ43AB', 1, NOW(), 1, NOW()),
(3, 'AZ43AD', 1, NOW(), 1, NOW()),
(3, 'AZ43AE', 1, NOW(), 1, NOW()),
(4, 'AZ43AF', 1, NOW(), 1, NOW()),
(1, 'AZ43AG', 1, NOW(), 1, NOW()),
(3, 'AZ43AH', 1, NOW(), 1, NOW()),
(2, 'AZ43AJ', 1, NOW(), 1, NOW()),
(1, 'AZ42KQ', 1, NOW(), 1, NOW());

-- flight_fare is the fare_class base price for that ticket only. Upgrades are booked per booking, so they appear in booking's total_amount and not here.
-- flight fare is an attribute of ticket but we want to show the derived value on the ticket that is the total amount (the base price plus any booking upgrade)
INSERT INTO ticket (e_ticket_number, booking_id, passenger_id, flight_id, fare_class_id, seat_number, flight_fare, checked_in, created_by, created_at, updated_by, last_updated) VALUES
('A2345678B', 'AZ42KU', 1003, 50009, 60012, '1B', 300.00, FALSE, 1, NOW(), 1, NOW()),
('B2345678C', 'AZ42KV', 1004, 50009, 60012, NULL, 300.00, FALSE, 1, NOW(), 1, NOW()), -- cancelled booking: seat_number NULL, so seat 1A is free
('C2345678D', 'AZ43AA', 1005, 50001, 60001, '1A', 189.00, TRUE, 1, NOW(), 1, NOW()),
('D2345678E', 'AZ43AA', 1006, 50001, 60001, '1B', 189.00, TRUE, 1, NOW(), 1, NOW()),
('E2345678F', 'AZ43AA', 1005, 50006, 60007, '1A', 195.00, FALSE, 1, NOW(), 1, NOW()),
('F2345678G', 'AZ43AA', 1006, 50006, 60007, '1B', 195.00, FALSE, 1, NOW(), 1, NOW()),
('G2345678H', 'AZ43AB', 1007, 50007, 60008, '1A', 410.00, FALSE, 1, NOW(), 1, NOW()),
('H2345678I', 'AZ43AB', 1007, 50008, 60010, '1A', 395.00, FALSE, 1, NOW(), 1, NOW()),
('I2345678J', 'AZ43AC', 1005, 50007, 60009, '2A', 248.00, FALSE, 1, NOW(), 1, NOW()),
('J2345678K', 'AZ43AC', 1005, 50008, 60011, '2A', 259.00, FALSE, 1, NOW(), 1, NOW()),
('K2345678L', 'AZ43AD', 1013, 50007, 60009, '2B', 248.00, FALSE, 1, NOW(), 1, NOW()),
('L2345678M', 'AZ43AE', 1008, 50002, 60002, '1A', 640.00, TRUE, 1, NOW(), 1, NOW()),
('M2345678N', 'AZ43AF', 1014, 50002, 60003, '1C', 229.00, TRUE, 1, NOW(), 1, NOW()),
('N2345678O', 'AZ43AG', 1009, 50003, 60004, '1A', 695.00, TRUE, 1, NOW(), 1, NOW()),
('O2345678P', 'AZ43AG', 1010, 50003, 60004, '1B', 695.00, TRUE, 1, NOW(), 1, NOW()),
('P2345678Q', 'AZ43AH', 1011, 50003, 60004, '2A', 695.00, TRUE, 1, NOW(), 1, NOW()),
('Q2345678R', 'AZ43AH', 1012, 50003, 60004, '2B', 695.00, TRUE, 1, NOW(), 1, NOW()),
('R2345678S', 'AZ43AI', 1013, 50004, 60005, '1A', 215.00, TRUE, 1, NOW(), 1, NOW()),
('S2345678T', 'AZ43AJ', 1003, 50004, 60005, '1B', 215.00, FALSE, 1, NOW(), 1, NOW()),
('T2345678U', 'AZ43AK', 1004, 50005, 60006, '1A', 289.00, FALSE, 1, NOW(), 1, NOW()),
('U2345678V', 'AZ42KQ', 1001, 50010, 60013, '2A', 653.00, FALSE, 1, NOW(), 1, NOW()),
('V2345678W', 'AZ42KQ', 1002, 50010, 60013, '2B', 653.00, FALSE, 1, NOW(), 1, NOW()),
('W2345678X', 'AZ42KQ', 1001, 50011, 60014, '2A', 641.00, FALSE, 1, NOW(), 1, NOW()),
('X2345678Y', 'AZ42KQ', 1002, 50011, 60014, '2B', 641.00, FALSE, 1, NOW(), 1, NOW());

-- AZ42KU is owed a refund (flight cancelled, payment still RECEIVED)
-- AZ42KV is already REFUNDED.
-- AZ43AC has no payment yet; AZ43AD has a PENDING payment with no payment_time.
INSERT INTO payment (payment_id, booking_id, payment_status, total_amount, payment_method, idempotency_key, payment_time, created_by, created_at, updated_by, last_updated) VALUES
(70001, 'AZ42KU', 'RECEIVED', 320.00, 'DEBIT', '9b1deb4d-3b7d-4bad-9b1d-bd7b7b7b7d05', '2026-10-11 10:15:00', 1, NOW(), 1, NOW()),
(70002, 'AZ42KV', 'REFUNDED', 300.00, 'CREDIT', '9b1deb4d-3b7d-4bad-9b1d-bd7b7b7b7d06', '2026-10-12 09:00:00', 1, NOW(), 1, NOW()),
(70003, 'AZ43AA', 'RECEIVED', 778.00, 'DEBIT', '89845ec2-41c2-5d6d-b06b-9d1f4628a680', '2026-09-18 19:30:00', 1, NOW(), 1, NOW()),
(70004, 'AZ43AB', 'RECEIVED', 810.00, 'CREDIT', 'd1d875f0-f6e3-5728-a018-f1a564a784fe', '2026-10-10 15:00:00', 1, NOW(), 1, NOW()),
(70005, 'AZ43AD', 'PENDING', 258.00, 'CREDIT', '05ba2aa8-c0a6-5355-b28c-474ecda86642', NULL, 1, NOW(), 1, NOW()),
(70006, 'AZ43AE', 'RECEIVED', 650.00, 'PAYPAL', '8e4b14bd-a66b-5651-8744-618c2b3b76c1', '2026-09-26 14:40:00', 1, NOW(), 1, NOW()),
(70007, 'AZ43AF', 'RECEIVED', 249.00, 'CREDIT', '4e270863-654d-5ed0-9ca3-42c846d33c00', '2026-09-25 08:15:00', 1, NOW(), 1, NOW()),
(70008, 'AZ43AG', 'RECEIVED', 1395.00, 'CREDIT', '814b38a4-c554-5cd0-9177-f3da200a8953', '2026-09-29 12:00:00', 1, NOW(), 1, NOW()),
(70009, 'AZ43AH', 'RECEIVED', 1400.00, 'DEBIT', 'e6642f88-0e16-554d-b047-ca31688bc821', '2026-10-03 16:45:00', 1, NOW(), 1, NOW()),
(70010, 'AZ43AI', 'RECEIVED', 215.00, 'DEBIT', 'cb600175-6b37-50c0-9d8a-3611401841d9', '2026-10-01 09:05:00', 1, NOW(), 1, NOW()),
(70011, 'AZ43AJ', 'RECEIVED', 230.00, 'CREDIT', '29698cbb-8ceb-5397-8dfc-cc7d83f59b6e', '2026-10-02 18:20:00', 1, NOW(), 1, NOW()),
(70012, 'AZ43AK', 'RECEIVED', 289.00, 'CREDIT', '98990a0c-ddff-5d44-8cc2-babc69ad3ca6', '2026-10-05 20:00:00', 1, NOW(), 1, NOW()),
(70013, 'AZ42KQ', 'RECEIVED', 2593.00, 'CREDIT', '9b1deb4d-3b7d-4bad-9b1d-bd7b7d7b7d01', '2026-10-10 22:00:00', 1, NOW(), 1, NOW());


INSERT INTO baggage (tag_number, e_ticket_number, weightage, baggage_status_id, fee, created_by, created_at, updated_by, last_updated) VALUES
('BG77801', 'C2345678D', 22.50, 4, 0.00, 1, NOW(), 1, NOW()), -- AZ410 ARRIVED
('BG77802', 'D2345678E', 11.00, 5, 0.00, 1, NOW(), 1, NOW()), -- AZ410 LOST
('BG77803', 'M2345678N', 47.80, 3, 0.00, 1, NOW(), 1, NOW()), -- AZ320 IN TRANSIT
('BG77804', 'N2345678O', 28.40, 2, 0.00, 1, NOW(), 1, NOW()), -- AZ640 LOADED
('BG77805', 'O2345678P', 53.10, 1, 35.00, 1, NOW(), 1, NOW()); -- AZ640 CHECKED (overweight fee)
