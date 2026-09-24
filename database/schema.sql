CREATE DATABASE IF NOT EXISTS airline_ticketing_system;
USE airline_ticketing_system;
CREATE TABLE Passengers (
    passenger_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    passport_number VARCHAR(20) UNIQUE,
    passport_expiry DATE,
    nationality CHAR(2),
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL
);
CREATE TABLE Airport (
    airport_id INT AUTO_INCREMENT PRIMARY KEY,
    airport_code CHAR(3) NOT NULL UNIQUE,
    airport_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    country CHAR(2) NOT NULL,
    timezone VARCHAR(50) NOT NULL
);
CREATE TABLE Terminal (
    terminal_id INT AUTO_INCREMENT PRIMARY KEY,
    terminal_name VARCHAR(20) NOT NULL,
    airport_id INT NOT NULL,
    FOREIGN KEY (airport_id) REFERENCES Airport(airport_id)
        ON DELETE RESTRICT
);
CREATE TABLE Gate (
    gate_id INT AUTO_INCREMENT PRIMARY KEY,
    gate_number VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    terminal_id INT NOT NULL,
    FOREIGN KEY (terminal_id) REFERENCES Terminal(terminal_id)
        ON DELETE RESTRICT,
    CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE'))
);