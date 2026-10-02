CREATE DATABASE airline_db;

USE airline_db;

-- Use lowercase letters for entities and attributes

CREATE TABLE user(
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    loyalty_points int NOT NULL DEFAULT 0, -- TODO: remove default, value must be set by the program

-- Copy these 4 into every table, have the created_by and updated_by reference the user table
created_at TIMESTAMP NOT NULL,
last_updated TIMESTAMP NOT NULL,
created_by INT NOT NULL,
updated_by INT NOT NULL,
CONSTRAINT check_loyalty_points CHECK (loyalty_points >= 0),
CONSTRAINT check_phone_number_format CHECK (REGEXP_LIKE(phone_number, '^[+]?[0-9]{7,15}$')),

CONSTRAINT check_email_format CHECK (email LIKE '%@%.%'),
CONSTRAINT check_email_length CHECK (
    LENGTH(email) <= 100
    AND LENGTH(email) >= 5
),


-- self-referencing foreign keys specific to the user table
CONSTRAINT fk_user_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    CONSTRAINT fk_user_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id)
);


CREATE TABLE passenger(
    passenger_id INT auto_increment PRIMARY KEY,
    user_id INT UNIQUE NULL, -- user_id must be unqiue here bc even if the pk of users has to be unique, passengers could still reference the same user_id, which shouldn't happen. Can be null when passenger is a child (dependent)
    passenger_parent_id INT NULL, -- References the parent passenger if this passenger is a child (dependent)
    first_name VARCHAR(50) NULL,
    last_name VARCHAR(50) NULL,
    date_of_birth DATE NULL,
    passport_number VARCHAR(9) NULL, -- 8 or 9 characters long; unique per country (see unique_passport_per_country)
    passport_expiry_date DATE NULL,
    nationality CHAR(2) NULL,

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_passport_number_length CHECK (LENGTH(passport_number) >= 8),
    CONSTRAINT check_passport_expiry_date CHECK (passport_expiry_date > date_of_birth),

    CONSTRAINT unique_passport_per_country UNIQUE (nationality, passport_number),
    CONSTRAINT check_passenger_nationality CHECK (REGEXP_LIKE(nationality, '^[A-Z]{2}$', 'c')),

-- Self referencing to itself
CONSTRAINT fk_passenger_parent FOREIGN KEY (passenger_parent_id) REFERENCES passenger (passenger_id)

-- No longer self referencing for all other tables
-- CONSTRAINT fk_passenger_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
-- CONSTRAINT fk_passenger_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id),

-- CONSTRAINT fk_passenger_user FOREIGN KEY (user_id) REFERENCES user(user_id),
);


CREATE TABLE employee(
    employee_id INT auto_increment PRIMARY KEY,
    user_id INT UNIQUE NOT NULL, -- user_id must be unqiue here bc even if the pk of users has to be unique, employees could still reference the same user_id, which shouldn't happen
    first_name VARCHAR(50) NULL,
    last_name VARCHAR(50) NULL,
    date_of_birth DATE NULL,
    salary DECIMAL(10,2) NULL,
    direct_supervisor_id INT NULL, -- CEO does not have a supervisor
    assigned_gate_id INT NULL, -- Can be null if the employee is not assigned to a gate
    job_role_id INT NOT NULL,
    hire_date date null,
    is_active BOOLEAN not null DEFAULT true, -- TODO: remove default, value must be set by the program

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_employee_is_active CHECK (is_active IN (0, 1)),
    CONSTRAINT check_salary CHECK (salary > 0),

-- self-referencing foreign key for the direct supervisor
CONSTRAINT fk_employee_direct_supervisor FOREIGN KEY (direct_supervisor_id) REFERENCES employee (employee_id)

-- CONSTRAINT fk_employee_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
-- CONSTRAINT fk_employee_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id)
-- 
-- CONSTRAINT fk_employee_assigned_gate FOREIGN KEY (assigned_gate_id) REFERENCES gate(gate_id),
-- CONSTRAINT fk_employee_job_role FOREIGN KEY (job_role_id) REFERENCES job_role(job_role_id)
-- CONSTRAINT fk_employee_user FOREIGN KEY (user_id) REFERENCES user(user_id)
);


CREATE TABLE department( -- Code table for employee departments
    department_id INT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL

-- CONSTRAINT fk_department_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
-- CONSTRAINT fk_department_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id)
);


CREATE TABLE job_role( -- Code table for employee job roles
    job_role_id INT PRIMARY KEY,
    job_role_name VARCHAR(100) NOT NULL UNIQUE,
    department_id INT NULL,

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL

-- CONSTRAINT fk_job_role_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
-- CONSTRAINT fk_job_role_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id)
);


CREATE TABLE maintenance_status( -- e.g. OPERATIONAL, MAINTENANCE, GROUNDED
    maintenance_status_id INT PRIMARY KEY,
    maintenance_status_name VARCHAR(20) NOT NULL UNIQUE,

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_maintenance_status_name CHECK (REGEXP_LIKE(maintenance_status_name, '^(OPERATIONAL|MAINTENANCE|GROUNDED)$', 'c'))
);


CREATE TABLE gate_status( -- e.g. AVAILABLE, OCCUPIED, MAINTENANCE
    gate_status_id INT PRIMARY KEY,
    gate_status_name VARCHAR(20) NOT NULL UNIQUE,

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_gate_status_name CHECK (REGEXP_LIKE(gate_status_name, '^(AVAILABLE|OCCUPIED|MAINTENANCE)$', 'c'))
);


CREATE TABLE flight_status( -- e.g. SCHEDULED, DELAYED, BOARDING, DEPARTED, ARRIVED, CANCELLED
    flight_status_id INT PRIMARY KEY,
    flight_status_name VARCHAR(20) NOT NULL UNIQUE,

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_flight_status_name CHECK (REGEXP_LIKE(flight_status_name, '^(SCHEDULED|DELAYED|BOARDING|DEPARTED|ARRIVED|CANCELLED)$', 'c'))
);


CREATE TABLE cabin_class( -- e.g. ECONOMY, PREMIUM, BUSINESS, FIRST
    cabin_class_id INT PRIMARY KEY,
    cabin_class_name VARCHAR(20) NOT NULL UNIQUE,

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_cabin_class_name CHECK (REGEXP_LIKE(cabin_class_name, '^(ECONOMY|PREMIUM|BUSINESS|FIRST)$', 'c'))
);


CREATE TABLE airport(
    airport_id INT PRIMARY KEY,
    airport_code CHAR(3) NOT NULL UNIQUE,
    airport_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    country CHAR(2) NOT NULL,
    timezone VARCHAR(50) NOT NULL,

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_airport_code_upper CHECK (REGEXP_LIKE(airport_code, '^[A-Z]{3}$', 'c')),
    CONSTRAINT check_airport_country_upper CHECK (REGEXP_LIKE(country, '^[A-Z]{2}$', 'c'))
);


CREATE TABLE aircraft(
    aircraft_id INT PRIMARY KEY,
    aircraft_number VARCHAR(10) NOT NULL UNIQUE,
    aircraft_type VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    seat_layout_config JSON NOT NULL,
    maintenance_status_id INT NOT NULL,

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_aircraft_capacity CHECK (capacity > 0),
    CONSTRAINT fk_aircraft_maintenance_status FOREIGN KEY (maintenance_status_id) REFERENCES maintenance_status(maintenance_status_id)
);


CREATE TABLE terminal(
    terminal_id INT PRIMARY KEY,
    terminal_name VARCHAR(20) NOT NULL,
    airport_id INT NOT NULL,

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT unique_terminal_per_airport UNIQUE (airport_id, terminal_name),
    CONSTRAINT fk_terminal_airport FOREIGN KEY (airport_id) REFERENCES airport(airport_id)
);


CREATE TABLE gate(
    gate_id INT PRIMARY KEY,
    gate_number VARCHAR(10) NOT NULL,
    gate_status_id INT NOT NULL,
    terminal_id INT NOT NULL,

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT unique_gate_per_terminal UNIQUE (terminal_id, gate_number),
    CONSTRAINT fk_gate_status FOREIGN KEY (gate_status_id) REFERENCES gate_status(gate_status_id),
    CONSTRAINT fk_gate_terminal FOREIGN KEY (terminal_id) REFERENCES terminal(terminal_id)
);


CREATE TABLE flight(
    flight_id INT PRIMARY KEY,
    flight_number VARCHAR(10) NOT NULL,
    aircraft_id INT NOT NULL,
    origin_airport_id INT NOT NULL,
    destination_airport_id INT NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    departure_gate_id INT NULL,
    arrival_gate_id INT NULL,
    flight_status_id INT NOT NULL,
    distance INT NOT NULL,

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_flight_times CHECK (arrival_time > departure_time),
    CONSTRAINT unique_flight_number_departure UNIQUE (flight_number, departure_time),
    CONSTRAINT fk_flight_aircraft FOREIGN KEY (aircraft_id) REFERENCES aircraft(aircraft_id),
    CONSTRAINT fk_flight_origin_airport FOREIGN KEY (origin_airport_id) REFERENCES airport(airport_id),
    CONSTRAINT fk_flight_destination_airport FOREIGN KEY (destination_airport_id) REFERENCES airport(airport_id),
    CONSTRAINT fk_flight_departure_gate FOREIGN KEY (departure_gate_id) REFERENCES gate(gate_id),
    CONSTRAINT fk_flight_arrival_gate FOREIGN KEY (arrival_gate_id) REFERENCES gate(gate_id),
    CONSTRAINT fk_flight_status FOREIGN KEY (flight_status_id) REFERENCES flight_status(flight_status_id)
);


CREATE TABLE fare_class(
    fare_class_id INT PRIMARY KEY,
    flight_id INT NOT NULL,
    cabin_class_id INT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    seats_total INT NOT NULL,
    seats_available INT NOT NULL,
    is_refundable BOOLEAN NOT NULL,
    change_fee DECIMAL(10,2) NOT NULL,

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_fare_price CHECK (base_price >= 0),
    CONSTRAINT check_fare_seats CHECK (seats_available <= seats_total),
    CONSTRAINT unique_fare_per_flight UNIQUE (flight_id, cabin_class_id),
    CONSTRAINT fk_fare_class_flight FOREIGN KEY (flight_id) REFERENCES flight(flight_id),
    CONSTRAINT fk_fare_class_cabin_class FOREIGN KEY (cabin_class_id) REFERENCES cabin_class(cabin_class_id)
);

-- Foreign keys for booking_status, seat_status, comfort_upgrade_type, booking and booking_upgrade
-- are added in foreign_keys.sql (run it after this file).
CREATE TABLE booking_status(
    booking_status_id INT PRIMARY KEY,
    booking_status_name VARCHAR(20) NOT NULL UNIQUE,

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_booking_status_name
        CHECK (REGEXP_LIKE(booking_status_name, '^(PENDING|CONFIRMED|CANCELLED|COMPLETED)$', 'c'))
);


CREATE TABLE seat_status(
    seat_status_id INT PRIMARY KEY,
    seat_status_name VARCHAR(20) NOT NULL UNIQUE,

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_seat_status_name
        CHECK (REGEXP_LIKE(seat_status_name, '^(AVAILABLE|HELD|BOOKED|BLOCKED)$', 'c'))
);


CREATE TABLE comfort_upgrade_type(
    upgrade_id INT PRIMARY KEY,
    upgrade_name VARCHAR(50) NOT NULL UNIQUE,
    upgrade_description VARCHAR(255) NOT NULL,
    upgrade_price DECIMAL(10,2) NOT NULL,

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_upgrade_price CHECK (upgrade_price >= 0),
    CONSTRAINT check_upgrade_name_not_blank CHECK (TRIM(upgrade_name) <> '')
);


CREATE TABLE booking(
    booking_id CHAR(6) PRIMARY KEY,
    passenger_id INT NOT NULL,
    booking_status_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD', -- TODO: remove default, value must be set by the program
    expires_at TIMESTAMP NULL,

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_booking_id CHECK (REGEXP_LIKE(booking_id, '^[A-Z0-9]{6}$', 'c')),
    CONSTRAINT check_booking_total CHECK (total_amount >= 0),
    CONSTRAINT check_booking_currency CHECK (REGEXP_LIKE(currency, '^[A-Z]{3}$', 'c')),
    CONSTRAINT check_booking_expiry CHECK (expires_at > created_at) -- A NULL expires_at passes; CHECK only rejects FALSE
);

-- Each row records an upgrade selected for a booking and its price at purchase time.


CREATE TABLE booking_upgrade(
    booking_upgrade_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id CHAR(6) NOT NULL,
    upgrade_id INT NOT NULL,
    quantity TINYINT NOT NULL DEFAULT 1, -- TODO: remove default, value must be set by the program
    unit_price DECIMAL(10,2) NOT NULL,

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT unique_booking_upgrade UNIQUE (booking_id, upgrade_id),
    CONSTRAINT check_booking_upgrade_quantity CHECK (quantity > 0),
    CONSTRAINT check_booking_upgrade_price CHECK (unit_price >= 0)
);


CREATE TABLE seat(
    (flight_id, seat_number) PRIMARY KEY,
    flight_id INT NOT NULL,
    seat_number VARCHAR(4) NOT NULL,
    cabin_class_id INT NOT NULL,
    seat_status_id INT NOT NULL,
    held_until TIMESTAMP NULL DEFAULT NULL, -- TODO: remove default, value must be set by the program

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL
);

CREATE TABLE baggage_status (
    baggage_status_id INT PRIMARY KEY,
    baggage_status_name VARCHAR(20) NOT NULL UNIQUE,

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_baggage_status_name CHECK (REGEXP_LIKE(baggage_status_name,'^(CHECKED|LOADED|IN_TRANSIT|ARRIVED|LOST)$','c'))
);

CREATE TABLE ticket (
    e_ticket_number VARCHAR(20) PRIMARY KEY,
    booking_id CHAR(6) NOT NULL,
    passenger_id INT NOT NULL,
    flight_id INT NOT NULL,
    fare_class_id INT NOT NULL,
    seat_number VARCHAR(4) NOT NULL,
    flight_fare DECIMAL(10, 2) NOT NULL,
    checked_in BOOLEAN NOT NULL DEFAULT FALSE, -- TODO: remove default, value must be set by the program

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_ticket_flight_fare CHECK (flight_fare >= 0),
    CONSTRAINT check_ticket_checked_in CHECK (checked_in IN (0, 1)),
    CONSTRAINT unique_ticket_flight_seat UNIQUE (flight_id, seat_number)
);


CREATE TABLE baggage(
    tag_number VARCHAR(20) PRIMARY KEY,
    ticket_id INT NOT NULL,
    weightage DECIMAL(5,2) NOT NULL, -- pounds
    baggage_status_id INT NOT NULL,
    fee DECIMAL(10,2) NOT NULL DEFAULT 0, -- TODO: remove default, value must be set by the program

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_baggage_weightage CHECK (weightage > 0 AND weightage <= 100),
    CONSTRAINT check_baggage_fee CHECK (fee >= 0)
);


CREATE TABLE payment(
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id CHAR(6) NOT NULL,
    payment_type VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    idempotency_key CHAR(36) NOT NULL UNIQUE,
    payment_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- TODO: remove default, value must be set by the program

    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_payment_amount CHECK (total_amount >= 0)
);