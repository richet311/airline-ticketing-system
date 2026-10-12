-- Seed data, Tier 1: status tables, cabin classes, departments, airports,
-- upgrade types. Needs Tier 0 (users). Run order: Tier0 > Tier1 > Tier2 > Tier3.
-- Seed data rules: see the top of Tier0Seed.sql.

USE airline_db;

INSERT INTO department (department_id, department_name, created_by, created_at, updated_by, last_updated) VALUES
(1, 'FLIGHT CREW', 1, NOW(), 1, NOW()),
(2, 'MANAGEMENT', 1, NOW(), 1, NOW()),
(3, 'CUSTOMER SERVICE', 1, NOW(), 1, NOW()),
(4, 'GATE', 1, NOW(), 1, NOW()),
(5, 'GROUND', 1, NOW(), 1, NOW());

INSERT INTO maintenance_status (maintenance_status_id, maintenance_status_name, created_by, created_at, updated_by, last_updated) VALUES
(1, 'OPERATIONAL', 1, NOW(), 1, NOW()),
(2, 'MAINTENANCE', 1, NOW(), 1, NOW()),
(3, 'GROUNDED', 1, NOW(), 1, NOW());

INSERT INTO gate_status (gate_status_id, gate_status_name, created_by, created_at, updated_by, last_updated) VALUES
(1, 'AVAILABLE', 1, NOW(), 1, NOW()),
(2, 'OCCUPIED', 1, NOW(), 1, NOW()),
(3, 'MAINTENANCE', 1, NOW(), 1, NOW());

INSERT INTO flight_status (flight_status_id, flight_status_name, created_by, created_at, updated_by, last_updated) VALUES
(1, 'SCHEDULED', 1, NOW(), 1, NOW()),
(2, 'DELAYED', 1, NOW(), 1, NOW()),
(3, 'BOARDING', 1, NOW(), 1, NOW()),
(4, 'DEPARTED', 1, NOW(), 1, NOW()),
(5, 'ARRIVED', 1, NOW(), 1, NOW()),
(6, 'CANCELLED', 1, NOW(), 1, NOW());

INSERT INTO cabin_class (cabin_class_id, cabin_class_name, created_by, created_at, updated_by, last_updated) VALUES
(1, 'ECONOMY', 1, NOW(), 1, NOW()),
(2, 'PREMIUM', 1, NOW(), 1, NOW()),
(3, 'BUSINESS', 1, NOW(), 1, NOW()),
(4, 'FIRST', 1, NOW(), 1, NOW());

INSERT INTO booking_status (booking_status_id, booking_status_name, created_by, created_at, updated_by, last_updated) VALUES
(1, 'PENDING', 1, NOW(), 1, NOW()),
(2, 'CONFIRMED', 1, NOW(), 1, NOW()),
(3, 'CANCELLED', 1, NOW(), 1, NOW());

INSERT INTO seat_status (seat_status_id, seat_status_name, created_by, created_at, updated_by, last_updated) VALUES
(1, 'AVAILABLE', 1, NOW(), 1, NOW()),
(2, 'HELD', 1, NOW(), 1, NOW()),
(3, 'BOOKED', 1, NOW(), 1, NOW()),
(4, 'BLOCKED', 1, NOW(), 1, NOW());

INSERT INTO baggage_status (baggage_status_id, baggage_status_name, created_by, created_at, updated_by, last_updated) VALUES
(1, 'CHECKED', 1, NOW(), 1, NOW()),
(2, 'LOADED', 1, NOW(), 1, NOW()),
(3, 'IN TRANSIT', 1, NOW(), 1, NOW()),
(4, 'ARRIVED', 1, NOW(), 1, NOW()),
(5, 'LOST', 1, NOW(), 1, NOW());

INSERT INTO upgrade_type (upgrade_id, upgrade_name, upgrade_description, upgrade_price, created_by, created_at, updated_by, last_updated) VALUES
(1, 'Pillow and blanket', 'Provides ammenities for comfortable sleeping', 5.00, 1, NOW(), 1, NOW()),
(2, 'Extra legroom', 'Seat with additional legroom', 15.00, 1, NOW(), 1, NOW()),
(3, 'Priority boarding', 'Board before standard boarding groups', 10.00, 1, NOW(), 1, NOW()),
(4, 'In-flight Wi-Fi', 'Wi-Fi access for one flight', 20.00, 1, NOW(), 1, NOW());

INSERT INTO airport (airport_id, airport_code, airport_name, city, country, timezone, created_by, created_at, updated_by, last_updated) VALUES
(10001, 'IAH', 'George Bush Intercontinental Airport', 'Houston', 'US', 'America/Chicago', 1, NOW(), 1, NOW()),
(10002, 'NRT', 'Narita International Airport', 'Narita', 'JP', 'Asia/Tokyo', 1, NOW(), 1, NOW()),
(10003, 'LHR', 'London Heathrow Airport', 'London', 'UK', 'Europe/London', 1, NOW(), 1, NOW()),
(10004, 'JFK', 'John F. Kennedy International Airport', 'New York', 'US', 'America/New_York', 1, NOW(), 1, NOW()),
(10005, 'CDG', 'Charles de Gaulle Airport', 'Paris', 'FR', 'Europe/Paris', 1, NOW(), 1, NOW());