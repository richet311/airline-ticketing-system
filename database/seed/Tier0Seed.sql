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

-- password_hash holds each user's password as plain text (the class doesn't need real hashes).
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
(16, 'Chloekishimoto@yahoo.com', '4445556666', 'kishimoto123', 100, 1, NOW(), 1, NOW()),
(17, 'MirandaCosgrove@AzureAir.net', '5556667777', 'AgentLoginPW123', 0, 1, NOW(), 1, NOW());

INSERT INTO passenger (passenger_id, user_id, passenger_parent_id, first_name, last_name, date_of_birth, passport_number, passport_expiry_date, nationality, created_by, created_at, updated_by, last_updated) VALUES
(1001, 2, NULL, 'TESTPASSENGER', 'SINGLEADULT', '2002-01-01', '222333444', '2028-06-01', 'US', 1, NOW(), 1, NOW()),
(1002, NULL, 1001, 'TESTCHILD', 'DEPENDENT', '2018-04-12', '123456789', '2030-04-12', 'US', 1, NOW(), 1, NOW()),
(1003, 4, NULL, 'Jane', 'Doe', '1995-07-19', '999887766', '2031-07-19', 'JP', 1, NOW(), 1, NOW()),
(1004, 5, NULL, 'John', 'Smith', '1988-11-03', '233210028', '2032-11-03', 'GB', 1, NOW(), 1, NOW()),
(1005, 7, NULL, 'Alex', 'Morgan', '1990-06-12', '713228899', '2031-03-15', 'US', 1, NOW(), 1, NOW()),
(1006, NULL, 1005, 'Mia', 'Smith', '2016-03-09', '032676637', '2031-03-09', 'US', 1, NOW(), 1, NOW()),
(1007, 8, NULL, 'Priya', 'Patel', '1993-02-27', '000998888', '2032-02-27', 'IN', 1, NOW(), 1, NOW()),
(1008, 9, NULL, 'Hiro', 'Uzumaki', '1987-10-30', '666882222', '2030-10-30', 'JP', 1, NOW(), 1, NOW()),
(1009, 10, NULL, 'Lena', 'Walker', '1991-12-05', '777665555', '2031-12-05', 'DE', 1, NOW(), 1, NOW()),
(1010, 11, NULL, 'Marco', 'Polo', '1989-04-18', '456870987', '2030-04-18', 'IT', 1, NOW(), 1, NOW()),
(1011, 12, NULL, 'Sofia', 'Vergaria', '1994-08-23', '768910234', '2029-08-23', 'ES', 1, NOW(), 1, NOW()),
(1012, 13, NULL, 'Noah', 'Miles', '1985-01-30', '562179090', '2029-01-30', 'US', 1, NOW(), 1, NOW()),
(1013, 14, NULL, 'Olivia', 'Keller', '1998-09-14', '095688282', '2033-09-14', 'US', 1, NOW(), 1, NOW()),
(1014, 15, NULL, 'Omar', 'Smith', '1982-07-07', '020201010', '2031-07-07', 'AE', 1, NOW(), 1, NOW()),
(1015, 16, NULL, 'Chloe', 'Kishimoto', '1996-05-21', '828282288', '2030-05-21', 'FR', 1, NOW(), 1, NOW());
