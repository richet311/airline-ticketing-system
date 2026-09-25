CREATE DATABASE airline_db;

USE airline_db;

-- Use lowercase letters for entities and attributes

CREATE TABLE user{
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NULL UNIQUE,
    password_hash VARCHAR(50) NOT NULL,
    loyalty_points INT NULL,
    
    -- Copy these 4 into every table, have the created_by and updated_by reference the user table
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_loyalty_points CHECK (loyalty_points >= 0),
    CONSTRAINT check_password_length CHECK (LENGTH(password_hash) BETWEEN 8 AND 50),
    CONSTRAINT check_email_format CHECK (email LIKE '%@%.%'),
    CONSTRAINT check_email_length CHECK (LENGTH(email) <= 100 AND LENGTH(email) >= 5),
    CONSTRAINT check_phone_number_for_letters CHECK (phone_number NOT REGEXP '^[0-9]+$'),

    --self-referencing foreign keys specific to the user table
    CONSTRAINT fk_user_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    CONSTRAINT fk_user_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id)
};

CREATE TABLE passenger{
    passenger_id INT PRIMARY KEY,
    user_id INT UNIQUE NULL, --user_id must be unqiue here bc even if the pk of users has to be unique, passengers could still reference the same user_id, which shouldn't happen. Can be null when passenger is a child (dependent)
    passenger_parent_id INT NULL, --References the parent passenger if this passenger is a child (dependent)
    first_name VARCHAR(50) NULL,
    last_name VARCHAR(50) NULL,
    date_of_birth DATE NULL,
    passport_number VARCHAR(9) NULL UNIQUE, -- Unique passport number regardless of nationality, either 8 or 9 characters long
    passport_expiry_date DATE NULL,
    nationality CHAR(2) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_date_of_birth CHECK (date_of_birth < CURRENT_DATE),
    CONSTRAINT check_passport_number_length CHECK (LENGTH(passport_number) >= 8),
    CONSTRAINT check_passport_expiry_date CHECK (passport_expiry_date > date_of_birth),
    CONSTRAINT check_passport_expiry_date CHECK (passport_expiry_date > CURRENT_DATE),

    --Self referencing to itself
    CONSTRAINT fk_passenger_parent FOREIGN KEY (passenger_parent_id) REFERENCES passenger(passenger_id),

    --No longer self referencing for all other tables
    --CONSTRAINT fk_passenger_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    --CONSTRAINT fk_passenger_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id),

    --CONSTRAINT fk_passenger_user FOREIGN KEY (user_id) REFERENCES user(user_id)
};

CREATE TABLE employee{
    employee_id INT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL, --user_id must be unqiue here bc even if the pk of users has to be unique, employees could still reference the same user_id, which shouldn't happen
    first_name VARCHAR(50) NULL,
    last_name VARCHAR(50) NULL,
    date_of_birth DATE NULL,
    salary DECIMAL(10,2) NULL,
    direct_supervisor_id INT NULL, --CEO does not have a supervisor
    assigned_gate_id INT NULL, --Can be null if the employee is not assigned to a gate
    department_id INT NOT NULL,
    job_role_id INT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_date_of_birth CHECK (date_of_birth < CURRENT_DATE),
    CONSTRAINT check_salary CHECK (salary > 0),

    -- self-referencing foreign key for the direct supervisor
    CONSTRAINT fk_employee_direct_supervisor FOREIGN KEY (direct_supervisor_id) REFERENCES employee(employee_id)

    --CONSTRAINT fk_employee_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    --CONSTRAINT fk_employee_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id)

    --CONSTRAINT fk_employee_assigned_gate FOREIGN KEY (assigned_gate_id) REFERENCES gate(gate_id),
    --CONSTRAINT fk_employee_department FOREIGN KEY (department_id) REFERENCES department(department_id),
    --CONSTRAINT fk_employee_job_role FOREIGN KEY (job_role_id) REFERENCES job_role(job_role_id)
    --CONSTRAINT fk_employee_user FOREIGN KEY (user_id) REFERENCES user(user_id)
};

CREATE TABLE department{ --Code table for employee departments
    department_id INT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT NOT NULL

    --CONSTRAINT fk_department_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    --CONSTRAINT fk_department_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id)
};

CREATE TABLE job_role{ --Code table for employee job roles
    job_role_id INT PRIMARY KEY,
    job_role_name VARCHAR(100) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    --CONSTRAINT fk_job_role_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    --CONSTRAINT fk_job_role_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id)
}

CREATE TABLE airport(
  airport_id SERIAL,
  airport_code CHAR(3) NOT NULL UNIQUE,
  airport_name VARCHAR(100) NOT NULL,
  city VARCHAR(50) NOT NULL,
  country CHAR(2) NOT NULL,
  timezone VARCHAR(50) NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  updated_by INT NOT NULL,

  --CONSTRAINT chk_airpor_code_upper CHECK (airport_code = UPPER(airport_code)),
  -- CONSTRAINT chk_airport_country_upper CHECK (country = UPPER(country))

  --CONSTRAINT fk_airport_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
  --CONSTRAINT fk_airport_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id)
);

CREATE TABLE aircraft(
  aircraft_id SERIAL,
  aircraft_number VARCHAR(10) NOT NULL UNIQUE,
  aircraft_type VARCHAR(50) NOT NULL,
  capacity INT NOT NULL,
  seat_layout_config JSONB NOT NULL,
  maintenance_status VARCHAR(20) NOT NULL DEFAULT 'OPERATIONAL',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  updated_by INT NOT NULL,

--   CONSTRAINT chk_aircraft_capacity 
--     CHECK (capacity > 0),
--   CONSTRAINT chck_aircraft_maintenance
--     CHECK (
--       maintenance_status IN (
--         'OPERATIONAL',
--         'MAINTENANCE',
--         'GROUNDED'
--       )
--     )

--CONSTRAINT fk_aircraft_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
--CONSTRAINT fk_aircraft_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id)
);


CREATE TABLE terminal(
  terminal_id SERIAL,
  terminal_name VARCHAR(20) NOT NULL,
  airport_id INT NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  updated_by INT NOT NULL,

--   CONSTRAINT uq_terminal_per_airport 
--     UNIQUE (airport_id, terminal_name)

--CONSTRAINT fk_terminal_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
--CONSTRAINT fk_terminal_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id)
);


CREATE TABLE gate(
  gate_id SERIAL,
  gate_number VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
  terminal_id INT NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  updated_by INT NOT NULL,

--   CONSTRAINT chk_gate_status
--     CHECK (
--       status IN (
--         'AVAILABLE',
--         'OCCUPIED',
--         'MAINTENANCE'
--       )
--     ),

--   CONSTRAINT uq_gate_per_terminal 
--     UNIQUE (terminal_id, gate_number)

--CONSTRAINT fk_gate_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
--CONSTRAINT fk_gate_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id)
);


CREATE TABLE flight(
  flight_id SERIAL,
  flight_number VARCHAR(10) NOT NULL,
  aircraft_id INT NOT NULL,
  origin_airport_id INT NOT NULL,
  destination_airport_id INT NOT NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ NOT NULL,
  departure_gate_id INT,
  arrival_gate_id INT,
  status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
  distance INT NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  updated_by INT NOT NULL,

--   CONSTRAINT chk_flight_status
--     CHECK (
--       status IN (
--         'SCHEDULED',
--         'BOARDING',
--         'DEPARTED',
--         'ARRIVED',
--         'DELAYED',
--         'CANCELED'
--       )
--     ),

--   CONSTRAINT chk_flight_different_airports
--     CHECK (origin_airport_id <> destination_airport_id),

--   CONSTRAINT chk_flight_times
--     CHECK (arrival_time > departure_time),

--   CONSTRAINT chk_flight_distance
--     CHECK (distance > 0),

--   CONSTRAINT uq_flight_number_departure
--     UNIQUE (flight_number, departure_time)

--CONSTRAINT fk_flight_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
--CONSTRAINT fk_flight_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id)
);

-- CREATE INDEX idx_flights_search
--   ON flights (
--     origin_airport_id,
--     destination_airport_id,
--     departure_time
--   );


-- 1 flight has many fare classes, and each data entry will have one type of cabin class
CREATE TABLE fare_class( 
  fare_class_id SERIAL,
  flight_id INT NOT NULL,
  cabin_class VARCHAR(20) NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  seats_total INT NOT NULL,
  seats_available INT NOT NULL,
  is_refundable BOOLEAN NOT NULL DEFAULT FALSE,
  change_fee DECIMAL(10,2) NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  updated_by INT NOT NULL,

--   CONSTRAINT chk_fare_cabin
--     CHECK (
--       cabin_class IN (
--         'ECONOMY',
--         'PREMIUM',
--         'BUSINESS',
--         'FIRST'
--       )
--     ),

--   CONSTRAINT chk_fare_price
--     CHECK (base_price >= 0),

--   CONSTRAINT chk_fare_seats_total
--     CHECK (seats_total > 0),

--   CONSTRAINT chk_fare_seats_avail
--     CHECK (
--       seats_available >= 0 
--       AND seats_available <= seats_total
--     ),

--   CONSTRAINT chk_fare_change_fee
--     CHECK (change_fee >= 0),

--   CONSTRAINT uq_fare_per_flight
--     UNIQUE (flight_id, cabin_class)

--CONSTRAINT fk_fare_class_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
--CONSTRAINT fk_fare_class_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id)
);