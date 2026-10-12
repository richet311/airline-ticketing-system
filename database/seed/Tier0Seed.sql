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
TRUNCATE TABLE ticket;
TRUNCATE TABLE payment;
TRUNCATE TABLE baggage;
TRUNCATE TABLE booking_upgrade;
TRUNCATE TABLE upgrade_type;

ALTER TABLE user AUTO_INCREMENT = 1;
ALTER TABLE passenger AUTO_INCREMENT = 1001;
ALTER TABLE employee AUTO_INCREMENT = 2001;
ALTER TABLE airport AUTO_INCREMENT = 10001;
ALTER TABLE aircraft AUTO_INCREMENT = 20001;
ALTER TABLE terminal AUTO_INCREMENT = 30001;
ALTER TABLE gate AUTO_INCREMENT = 40001;
ALTER TABLE flight AUTO_INCREMENT = 50001;
ALTER TABLE fare_class AUTO_INCREMENT = 60001;
ALTER TABLE payment AUTO_INCREMENT = 70001;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO user (user_id, email, phone_number, password_hash, loyalty_points, created_by, created_at, updated_by, last_updated) VALUES
(1, 'SysAdmin@AzureAir.net', '1234567890', 'TestAdminLogin123', 1500, 1, NOW(), 1, NOW()),
(2, 'TestPassenger@AzureAir.net', '1111111111', 'TestPassengerPW123', 0, 1, NOW(), 1, NOW()),
(3, 'TestEmployee@AzureAir.net', '9999999999', 'TestEmployeePW123', 350, 1, NOW(), 1, NOW()),
(4, 'Janedoe@gmail.com', '2222222222', 'JanedoePW123', 5000, 1, NOW(), 1, NOW()),
(5, 'Johnsmith@gmail.com', '3333333333', 'johnsmithPW123', 30000, 1, NOW(), 1, NOW()),
(6, 'Kennylee@gmail.com', '4444444444', 'kennypsw', 50000, 1, NOW(), 1, NOW()),
(7, 'Alexmorgan@yahoo.com', '5555555555', 'ampw123', 1200, 1, NOW(), 1, NOW()),
(8, 'Priyapatel@yahoo.com', '6666666666', 'pripat321', 800, 1, NOW(), 1, NOW()),
(9, 'Hirouzumaki@hotmail.com', '7777777777', 'narutoshippuden!', 15000, 1, NOW(), 1, NOW()),
(10, 'Lenawalker@gmail.com', '8888888888', 'lennna123', 2500, 1, NOW(), 1, NOW()),
(11, 'Marcoapolo@gmail.com', '9876543210', 'mpolo2pw', 0, 1, NOW(), 1, NOW()),
(12, 'Sofiavergaria@outlook.org', '0001112222', 'svoutl00k', 300, 1, NOW(), 1, NOW()),
(13, 'Noahm123@gmail.com', '1112223333', 'n04h123!', 4100, 1, NOW(), 1, NOW()),
(14, 'Oliviakeller@gmail.com', '2223334444', 'OKPASSWORD', 650, 1, NOW(), 1, NOW()),
(15, 'Omarsmith@gmail.com', '3334445555', 'ospassword!', 22000, 1, NOW(), 1, NOW()),
(16, 'Chloekishimoto@yahoo.com', '4445556666', 'kishimoto123', 100, 1, NOW(), 1, NOW());

INSERT INTO passenger (passenger_id, user_id, passenger_parent_id, first_name, last_name, date_of_birth, passport_number, passport_expiry_date, nationality, created_by, created_at, updated_by, last_updated) VALUES
(1001, 2, NULL, 'TESTPASSENGER', 'SINGLEADULT', '2002-01-01', '222333444', '2028-06-01', 'US', 1, NOW(), 1, NOW()),
(1002, NULL, 1001, 'TESTCHILD', 'DEPENDENT', '2018-04-12', '123456789', '2030-04-12', 'US', 1, NOW(), 1, NOW()),
(1003, 4, NULL, 'Jane', 'Doe', '1995-07-19', '999887766', '2031-07-19', 'JP', 1, NOW(), 1, NOW()),
(1004, 5, NULL, 'John', 'Smith', '1988-11-03', '233210028', '2032-11-03', 'GB', 1, NOW(), 1, NOW()),
(1005, 7, NULL, 'Alex', 'Sample', '1990-06-12', '713228899', '2031-03-15', 'US', 1, NOW(), 1, NOW()),
(1006, NULL, 1005, 'Mia', 'Sample', '2016-03-09', '032676637', '2031-03-09', 'US', 1, NOW(), 1, NOW()),
(1007, 8, NULL, 'Priya', 'Example', '1993-02-27', '000998888', '2032-02-27', 'IN', 1, NOW(), 1, NOW()),
(1008, 9, NULL, 'Hiro', 'Demo', '1987-10-30', '666882222', '2030-10-30', 'JP', 1, NOW(), 1, NOW()),
(1009, 10, NULL, 'Lena', 'Demo', '1991-12-05', '777665555', '2031-12-05', 'DE', 1, NOW(), 1, NOW()),
(1010, 11, NULL, 'Marco', 'Test', '1989-04-18', '456870987', '2030-04-18', 'IT', 1, NOW(), 1, NOW()),
(1011, 12, NULL, 'Sofia', 'Test', '1994-08-23', '768910234', '2029-08-23', 'ES', 1, NOW(), 1, NOW()),
(1012, 13, NULL, 'Noah', 'Sample', '1985-01-30', '562179090', '2029-01-30', 'US', 1, NOW(), 1, NOW()),
(1013, 14, NULL, 'Olivia', 'Example', '1998-09-14', '095688282', '2033-09-14', 'US', 1, NOW(), 1, NOW()),
(1014, 15, NULL, 'Omar', 'Demo', '1982-07-07', '020201010', '2031-07-07', 'AE', 1, NOW(), 1, NOW()),
(1015, 16, NULL, 'Chloe', 'Test', '1996-05-21', '828282288', '2030-05-21', 'FR', 1, NOW(), 1, NOW());
