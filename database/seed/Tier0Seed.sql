-- =============================================================================
-- Seed data, Tier 0: empties all 25 tables, then adds users and passengers.
--
-- HOW TO RUN
--   Run all four tiers in order: Tier0Seed.sql, Tier1Seed.sql, Tier2Seed.sql,
--   Tier3Seed.sql. Run schema.sql first if the table structure changed;
--   otherwise Tier 0 to 3 on their own reset the data.
--   Never run one tier by itself: its rows already exist ("Duplicate entry").
--
-- SEED DATA RULES (apply to all four tier files)
--   1. Tiers follow the foreign keys. A row may only point at rows from an
--      earlier tier, or rows inserted above it in the same file. Put a new
--      table in the earliest tier where everything it points at already exists.
--   2. Write the column list in every INSERT and fill all four audit columns.
--      created_at and last_updated have no default, so leaving them out fails.
--   3. Use created_by = 1 and updated_by = 1 (the SysAdmin user below).
--   4. IDs are typed by hand. Check which IDs a table already uses before
--      adding rows.
--   5. Add every new table to the TRUNCATE list below.
--   6. Fake data only: no real names, emails, passport numbers or passwords.
-- =============================================================================

USE airline_db;

-- MySQL won't empty a table while another table's foreign key points at it,
-- so foreign key checks are off while the tables are emptied.
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
