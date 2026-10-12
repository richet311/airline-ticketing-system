-- Tier 2: job roles, terminals, aircraft, gates and employees.

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
(101, 'Terminal A', 1, 1, NOW(), 1, NOW()),
(102, 'Terminal B', 1, 1, NOW(), 1, NOW()),
(201, 'Terminal A', 2, 1, NOW(), 1, NOW()),
(202, 'Terminal C', 2, 1, NOW(), 1, NOW()),
(301, 'Terminal D', 3, 1, NOW(), 1, NOW()),
(302, 'Terminal E', 3, 1, NOW(), 1, NOW());

-- delete seat_layout_config JSON from schema
-- Need a workaround for having flights at full capacity without needing 370 individual seat tuples
INSERT INTO aircraft (aircraft_id, aircraft_number, aircraft_type, capacity, seat_layout_config, maintenance_status_id, created_by, created_at, updated_by, last_updated) VALUES
(1, 'N123DL', 'Boeing 747', 370, JSON_OBJECT('rows', 5, 'layout', '3-4-3', 'seat_letters', JSON_ARRAY('A','B','C','D','E','F','G','H','I','J')), 1, 1, NOW(), 1, NOW());

INSERT INTO gate (gate_id, gate_number, gate_status_id, terminal_id, created_by, created_at, updated_by, last_updated) VALUES
(1, '23A', 1, 101, 1 , NOW(), 1, NOW()),
(2, '12B', 1, 102, 1 , NOW(), 1, NOW()),
(3, '11A', 1, 201, 1 , NOW(), 1, NOW()),
(4, '1C', 1, 202, 1 , NOW(), 1, NOW()),
(5, '16D', 2, 301, 1 , NOW(), 1, NOW()),
(6, '9E', 3, 302, 1 , NOW(), 1, NOW());

INSERT INTO employee (employee_id, user_id, first_name, last_name, date_of_birth, salary, direct_supervisor_id, assigned_gate_id, job_role_id, hire_date, is_active, created_by, created_at, updated_by, last_updated) VALUES
(2001, 1, 'TESTEMPLOYEE', 'SYSADMIN', '2002-02-02', 75000, NULL, NULL, 91, '2026-08-28', TRUE, 1, NOW(), 1, NOW());
