-- Seed data, Tier 2: job roles, terminals, aircraft, gates, employees.
-- Needs Tiers 0 and 1 (users, departments, airports, statuses).
-- Run order: Tier0 > Tier1 > Tier2 > Tier3. Seed data rules: see the top of Tier0Seed.sql.

USE airline_db;

INSERT INTO job_role (job_role_id, job_role_name, department_id, created_by, created_at, updated_by, last_updated) VALUES
(91, 'System Administrator', 2, 1, NOW(), 1, NOW()),
(92, 'Operations Manager', 2, 1, NOW(), 1, NOW()),
(93, 'Airplane Pilot', 1, 1, NOW(), 1, NOW()),
(94, 'Flight attendant', 1, 1, NOW(), 1, NOW()),
(95, 'Customer Service Agent', 3, 1, NOW(), 1, NOW()),
(96, 'Gate Agent', 4, 1, NOW(), 1, NOW()),
(97, 'Tarmac Agent', 5, 1, NOW(), 1, NOW());

INSERT INTO terminal (terminal_id, terminal_name, airport_id, created_by, created_at, updated_by, last_updated) VALUES
(30001, 'Terminal A', 10001, 1, NOW(), 1, NOW()),
(30002, 'Terminal B', 10001, 1, NOW(), 1, NOW()),
(30003, 'Terminal A', 10002, 1, NOW(), 1, NOW()),
(30004, 'Terminal C', 10002, 1, NOW(), 1, NOW()),
(30005, 'Terminal D', 10003, 1, NOW(), 1, NOW()),
(30006, 'Terminal E', 10003, 1, NOW(), 1, NOW()),
(30007, 'Terminal 4', 10004, 1, NOW(), 1, NOW()),
(30008, 'Terminal 2E', 10005, 1, NOW(), 1, NOW());

-- Need a workaround for having flights at full capacity without needing 370 individual seat tuples
INSERT INTO aircraft (aircraft_id, aircraft_number, aircraft_type, capacity, maintenance_status_id, created_by, created_at, updated_by, last_updated) VALUES
(20001, 'N123DL', 'Boeing medium', 8, 1, 1, NOW(), 1, NOW()),
(20002, 'N456DL', 'Boeing private jet', 4, 1, 1, NOW(), 1, NOW()),
(20003, 'N789DL', 'Boeing small', 6, 1, 1, NOW(), 1, NOW());

INSERT INTO gate (gate_id, gate_number, gate_status_id, terminal_id, created_by, created_at, updated_by, last_updated) VALUES
(40001, '23A', 1, 30001, 1 , NOW(), 1, NOW()),
(40002, '12B', 1, 30002, 1 , NOW(), 1, NOW()),
(40003, '11A', 1, 30003, 1 , NOW(), 1, NOW()),
(40004, '1C', 1, 30004, 1 , NOW(), 1, NOW()),
(40005, '16D', 2, 30005, 1 , NOW(), 1, NOW()),
(40006, '9E', 3, 30006, 1 , NOW(), 1, NOW()),
(40007, '41', 1, 30007, 1, NOW(), 1, NOW()),
(40008, 'B12', 1, 30008, 1, NOW(), 1, NOW());

INSERT INTO employee (employee_id, user_id, first_name, last_name, date_of_birth, salary, direct_supervisor_id, assigned_gate_id, job_role_id, hire_date, is_active, created_by, created_at, updated_by, last_updated) VALUES
(2001, 1, 'TESTEMPLOYEE', 'SYSADMIN', '2002-02-02', 75000, NULL, NULL, 91, '2026-08-28', TRUE, 1, NOW(), 1, NOW()),
(2002, 3, 'TAYLOR', 'EXAMPLE', '1985-05-14', 68000.00, 2001, NULL, 92, '2022-03-10', TRUE, 1, NOW(), 1, NOW()),
(2003, 6, 'MORGAN', 'SAMPLE', '1990-09-22', 52000.00, 2002, 40007, 96, '2024-01-15', TRUE, 1, NOW(), 1, NOW());
