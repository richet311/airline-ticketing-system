-- Tier 0: clears every table, then adds users and passengers.
-- Run Tier0 to Tier3 in order. Run schema.sql first if a table changed.

USE airline_db;

-- Turn off FK checks so the tables can be truncated
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE user;
TRUNCATE TABLE passenger;
TRUNCATE TABLE department;
TRUNCATE TABLE maintenance_status;
TRUNCATE TABLE gate_status;
TRUNCATE TABLE flight_status;
TRUNCATE TABLE cabin_class;
TRUNCATE TABLE booking_status;
TRUNCATE TABLE seat_status;
TRUNCATE TABLE baggage_status;
TRUNCATE TABLE airport;
TRUNCATE TABLE job_role;
TRUNCATE TABLE terminal;
TRUNCATE TABLE aircraft;
TRUNCATE TABLE gate;
TRUNCATE TABLE employee;
TRUNCATE TABLE flight;
TRUNCATE TABLE fare_class;
TRUNCATE TABLE seat;
TRUNCATE TABLE booking;
TRUNCATE TABLE booking_upgrade;
TRUNCATE TABLE ticket;
TRUNCATE TABLE payment;
TRUNCATE TABLE baggage;
TRUNCATE TABLE comfort_upgrade_type;

SET FOREIGN_KEY_CHECKS = 1;

-- possibly remove auto increments everywhere and make our own methodology

INSERT INTO user (user_id, email, phone_number, password_hash, loyalty_points, created_by, created_at, updated_by, last_updated) VALUES
(1, 'SysAdmin@AzureAir.net', '1234567890', 'p@ssw0rd', 1500, 1, NOW(), 1, NOW()),
(2, 'TestPassenger@AzureAir.net', '1111111111', 'Testpw123', 0, 1, NOW(), 1, NOW()),
(3, 'TestEmployee@AzureAir.net', '9999999999', 'TEST123PW', 350, 1, NOW(), 1, NOW());

INSERT INTO passenger (passenger_id, user_id, passenger_parent_id, first_name, last_name, date_of_birth, passport_number, passport_expiry_date, nationality, created_by, created_at, updated_by, last_updated) VALUES
(1001, 2, NULL, 'TESTPASSENGER', 'SINGLEADULT', '2002-01-01', '222333444', '2028-06-01', 'US', 1, NOW(), 1, NOW());
