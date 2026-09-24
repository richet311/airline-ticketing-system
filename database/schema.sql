CREATE DATABASE airline_db;

USE airline_db;

-- Use lowercase letters for entities and attributes

CREATE TABLE user{
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(50) NOT NULL,
    phone_number VARCHAR(15) NULL UNIQUE,
    password_hash VARCHAR(50) NOT NULL,
    loyalty_points INT NULL,
    passenger_id INT NULL,
    employee_id INT NULL,
    
    -- Copy these 4 into every table, have the created_by and updated_by reference the user table
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT check_loyalty_points CHECK (loyalty_points >= 0),
    CONSTRAINT check_password_length CHECK (LENGTH(password_hash) BETWEEN 8 AND 50),
    CONSTRAINT check_email_format CHECK (email LIKE '%@%.%'),
    CONSTRAINT check_email_length CHECK (LENGTH(email) <= 50 && LENGTH(email) >= 5),
    CONSTRAINT check_phone_number_for_letters CHECK (phone_number NOT LIKE '%[a-zA-Z]%'),

    --self-referencing foreign keys specific to the user table
    CONSTRAINT fk_user_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    CONSTRAINT fk_user_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id)

    --CONSTRAINT fk_user_passenger FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id),
    --CONSTRAINT fk_user_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
};

CREATE TABLE passenger{
    passenger_id INT PRIMARY KEY,
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
    CONSTRAINT check_passport_expiry_date CHECK (passport_expiry_date > date_of_birth), --Leave if expiry > current date for a trigger, or ensure seed data never violates

    --No longer self referencing for all other tables
    --CONSTRAINT fk_passenger_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    --CONSTRAINT fk_passenger_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id)
};

CREATE TABLE employee{
    employee_id INT PRIMARY KEY,
    first_name VARCHAR(50) NULL,
    last_name VARCHAR(50) NULL,
    date_of_birth DATE NULL,
    salary DECIMAL(10,2) NULL,
    direct_supervisor_id INT NULL, --CEO does not have a supervisor
    assigned_gate_id INT NOT NULL,
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

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,

  --CONSTRAINT chk_airpor_code_upper CHECK (airport_code = UPPER(airport_code)),
  -- CONSTRAINT chk_airport_country_upper CHECK (country = UPPER(country))
);

-- CREATE TRIGGER trg_airport_updated_at
--   BEFORE UPDATE ON airport
--   FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE aircraft(
  aircraft_id SERIAL,
  aircraft_number VARCHAR(10) NOT NULL UNIQUE,
  aircraft_type VARCHAR(50) NOT NULL,
  capacity INT NOT NULL,
  seat_layout_config JSONB NOT NULL,
  maintenance_status VARCHAR(20) NOT NULL DEFAULT 'OPERATIONAL',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,

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
);

-- CREATE TRIGGER trg_aircraft_updated_at
--   BEFORE UPDATE ON aircraft
--   FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE terminal(
  terminal_id SERIAL,
  terminal_name VARCHAR(20) NOT NULL,
  airport_id INT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,

--   CONSTRAINT uq_terminal_per_airport 
--     UNIQUE (airport_id, terminal_name)
);

-- CREATE TRIGGER trg_terminal_updated_at
--   BEFORE UPDATE ON terminal
--   FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE gate(
  gate_id SERIAL,
  gate_number VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
  terminal_id INT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,

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
);

-- CREATE TRIGGER trg_gate_updated_at
--   BEFORE UPDATE ON gate
--   FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE flights(
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

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,

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
);

-- CREATE INDEX idx_flights_search
--   ON flights (
--     origin_airport_id,
--     destination_airport_id,
--     departure_time
--   );

-- CREATE TRIGGER trg_flights_updated_at
--   BEFORE UPDATE ON flights
--   FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE fare_class(
  fare_class_id SERIAL,
  flight_id INT NOT NULL,
  cabin_class VARCHAR(20) NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  seats_total INT NOT NULL,
  seats_available INT NOT NULL,
  is_refundable BOOLEAN NOT NULL DEFAULT FALSE,
  change_fee DECIMAL(10,2) NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,

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
);

-- CREATE TRIGGER trg_fare_class_updated_at
--   BEFORE UPDATE ON fare_class
--   FOR EACH ROW EXECUTE FUNCTION set_updated_at();