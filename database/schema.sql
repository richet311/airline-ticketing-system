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