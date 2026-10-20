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

-- Test passwords are in the comment on each row.
INSERT INTO user (user_id, email, phone_number, password_hash, loyalty_points, created_by, created_at, updated_by, last_updated) VALUES
(1, 'SysAdmin@AzureAir.net', '1234567890', 'scrypt$ef1e6cadb8ddbf5693303c979f40e89b$e5e37963f7a7755337bbc0500b383e20e6887050d4718b863b18a76e742d1e44b642b91c69c0a7412f5f7d202c34c2d896f0db55555d12aaf8d085da1564ac75', 1500, 1, NOW(), 1, NOW()), -- password: TestAdminLogin123
(2, 'TestPassenger@AzureAir.net', '1111111111', 'scrypt$ad03f4d5b70a03934439c305787cb671$fd52c40eb295e32cc1f4c101804f91b793252ae1a4992b62bf925d721aba1b63fb8519d6c48592ebf5a989b1c08db809374a55469f38688d71eaa94a284ced54', 0, 1, NOW(), 1, NOW()), -- password: TestPassengerPW123
(3, 'TestEmployee@AzureAir.net', '9999999999', 'scrypt$9ba2ad6f02b8c1b3220f747234e7348d$937a6559af39d6eb42114047fb07cb9b26866e89a2979c2cdc9c130505f30ba65d0282a8d03c752ed062d513c2f7a67b8f9532e8051a5b194f1b7e04a545a5a8', 350, 1, NOW(), 1, NOW()), -- password: TestEmployeePW123
(4, 'Janedoe@gmail.com', '2222222222', 'scrypt$57066447b8aa075e8735bbdcabc8bacf$9301cec92632daabf5402b29e869396f9baa86034bb46141d97825ec84defc46746929d51ccbc4faa8ed35acaa9f9e0ef076c1f06e48b5013e0424b2f308376c', 5000, 1, NOW(), 1, NOW()), -- password: JanedoePW123
(5, 'Johnsmith@gmail.com', '3333333333', 'scrypt$ac5d585e7fdc1891f5257baa788e1184$d3549b8c61f0410e4eb5dcb0306bf12f3a8e2aefa848142e1cd2029cd745116d150863edff5f2523bdbaa5421ee990b75c1f0f60a64211d8c899147ea0386e9c', 30000, 1, NOW(), 1, NOW()), -- password: johnsmithPW123
(6, 'Kennylee@gmail.com', '4444444444', 'scrypt$b0a7293a7d4dfaf512ebd95497e9c517$7df86c8dff386b71ce462097cb3723503c47d8d92049901d8b46e4dfb2a3fc79393094dcb8192a95c873c528cfc1ddcdb86ce54510cce0f73c467089278a01bd', 50000, 1, NOW(), 1, NOW()), -- password: kennypsw
(7, 'Alexmorgan@yahoo.com', '5555555555', 'scrypt$e28bf33bcfd4a1772b9664ba688c14b9$2850ef9966c54c77212efca71609ff6e2d9e179634bc71907a59ac41f9545a88815aa6f8d1ab9dfab865ebfc263eed521ce6afad97b00bb485ae3c95a956d9b3', 1200, 1, NOW(), 1, NOW()), -- password: ampw123
(8, 'Priyapatel@yahoo.com', '6666666666', 'scrypt$9bde172757706faf9056f0c3896fd16a$f05cb4aa5ce9d2a321fa78a27c12b4f8c172f04f19d3423c3af6670358a60a0d7fcaa1fb657d1eea518e6cfa621abc6c673a802878da526ca2efb63c26ac6307', 800, 1, NOW(), 1, NOW()), -- password: pripat321
(9, 'Hirouzumaki@hotmail.com', '7777777777', 'scrypt$659ba56865d42830339025b54552b842$79768d59352fb8dee9ba3de60412c33a66b57ab044226b1add389484978fb53f161723edc7d266310b89c1b5b7f5b824b561285114b20418bac1e9d6be3e8ed7', 15000, 1, NOW(), 1, NOW()), -- password: narutoshippuden!
(10, 'Lenawalker@gmail.com', '8888888888', 'scrypt$23d0f0fdd1930bf45701a60e8d44bd4e$71c9a28ba44c583f4d0b33538281f43034b8692f44b103ac5102d026a37bccb5a129b31f623e59643e81c18a2b261c9309a9cb69e20f1eaf987356a00cecc4cd', 2500, 1, NOW(), 1, NOW()), -- password: lennna123
(11, 'Marcoapolo@gmail.com', '9876543210', 'scrypt$2baeef702b533439c651367ab2680864$e1fba764e9d3eb48cc347a4a39ff7ef5c3e2448efe54c33a72dd4fd4e655cd610ecfe6a8f0d80371c79809fec503299ace9cad74d3670ba80c0f14c639d644b5', 0, 1, NOW(), 1, NOW()), -- password: mpolo2pw
(12, 'Sofiavergaria@outlook.org', '0001112222', 'scrypt$f74214a4fab4d471dcf42266b42fd1f7$ae64e124edba0e28e15ef194ea3ed0e46484f6336dbf3fae188e8adf35d4fbafec5ef7ba703beda8c8cda2c0ab898b8d624c71885f6ed9cbbb970a27a48263fe', 300, 1, NOW(), 1, NOW()), -- password: svoutl00k
(13, 'Noahm123@gmail.com', '1112223333', 'scrypt$aa225a02298077ad75fa027e1039ce0b$2a266bace4e212f94c1a71b3a2b09c01b6ca5b312fefd6409196601d2739b4c312b2931eada8c01a0daa67dc014aeb7c5d76d6ee9756052205f69671cadfb349', 4100, 1, NOW(), 1, NOW()), -- password: n04h123!
(14, 'Oliviakeller@gmail.com', '2223334444', 'scrypt$e690984e3d6ac9369d1c13848c6bfbe6$a66ef2e6686cb0b52a1b543e59dccca60c0908a054e5bf04b8b7cc85a21782300721a9cdd3bb5fd5f7e816687aa60055bbf6e7f1b5a6db7ab7cee8c2e59c36e6', 650, 1, NOW(), 1, NOW()), -- password: OKPASSWORD
(15, 'Omarsmith@gmail.com', '3334445555', 'scrypt$432f7626a6d65599122117a99f4f7aa2$e4510f586e30828f480c57facff41f94e4cc56bf7c85c227267816f9d387b945dbca5cefdaa5736618f61b3490293272567825e17bbccd03dcf9bb0294d3b6a0', 22000, 1, NOW(), 1, NOW()), -- password: ospassword!
(16, 'Chloekishimoto@yahoo.com', '4445556666', 'scrypt$66c1650352763f093a15ea20d3ff8e31$69bc0e88027b68f73a0d929c07615b7df96c82cc841a96b2689f53c997f20d9213567146396f74d8865dd27ea72a95ea1ec0de1531ea41fb9b9d9df4a838232e', 100, 1, NOW(), 1, NOW()); -- password: kishimoto123

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
