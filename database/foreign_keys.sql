USE airline_db;


-- Moved from schema.sql (previously inline or commented out)


ALTER TABLE user
    ADD CONSTRAINT fk_user_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_user_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE passenger
    ADD CONSTRAINT fk_passenger_parent FOREIGN KEY (passenger_parent_id) REFERENCES passenger (passenger_id),
    ADD CONSTRAINT fk_passenger_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_passenger_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_passenger_user FOREIGN KEY (user_id) REFERENCES user(user_id);


ALTER TABLE employee
    ADD CONSTRAINT fk_employee_direct_supervisor FOREIGN KEY (direct_supervisor_id) REFERENCES employee (employee_id),
    ADD CONSTRAINT fk_employee_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_employee_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_employee_assigned_gate FOREIGN KEY (assigned_gate_id) REFERENCES gate(gate_id),
    ADD CONSTRAINT fk_employee_job_role FOREIGN KEY (job_role_id) REFERENCES job_role(job_role_id),
    ADD CONSTRAINT fk_employee_user FOREIGN KEY (user_id) REFERENCES user(user_id);


ALTER TABLE department
    ADD CONSTRAINT fk_department_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_department_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE job_role
    ADD CONSTRAINT fk_job_role_department FOREIGN KEY (department_id) REFERENCES department(department_id),
    ADD CONSTRAINT fk_job_role_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_job_role_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE aircraft
    ADD CONSTRAINT fk_aircraft_maintenance_status FOREIGN KEY (maintenance_status_id) REFERENCES maintenance_status(maintenance_status_id),
    ADD CONSTRAINT fk_aircraft_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_aircraft_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE terminal
    ADD CONSTRAINT fk_terminal_airport FOREIGN KEY (airport_id) REFERENCES airport(airport_id),
    ADD CONSTRAINT fk_terminal_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_terminal_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE gate
    ADD CONSTRAINT fk_gate_status FOREIGN KEY (gate_status_id) REFERENCES gate_status(gate_status_id),
    ADD CONSTRAINT fk_gate_terminal FOREIGN KEY (terminal_id) REFERENCES terminal(terminal_id),
    ADD CONSTRAINT fk_gate_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_gate_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE flight
    ADD CONSTRAINT fk_flight_aircraft FOREIGN KEY (aircraft_id) REFERENCES aircraft(aircraft_id),
    ADD CONSTRAINT fk_flight_origin_airport FOREIGN KEY (origin_airport_id) REFERENCES airport(airport_id),
    ADD CONSTRAINT fk_flight_destination_airport FOREIGN KEY (destination_airport_id) REFERENCES airport(airport_id),
    ADD CONSTRAINT fk_flight_departure_gate FOREIGN KEY (departure_gate_id) REFERENCES gate(gate_id),
    ADD CONSTRAINT fk_flight_arrival_gate FOREIGN KEY (arrival_gate_id) REFERENCES gate(gate_id),
    ADD CONSTRAINT fk_flight_status FOREIGN KEY (flight_status_id) REFERENCES flight_status(flight_status_id),
    ADD CONSTRAINT fk_flight_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_flight_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE fare_class
    ADD CONSTRAINT fk_fare_class_flight FOREIGN KEY (flight_id) REFERENCES flight(flight_id),
    ADD CONSTRAINT fk_fare_class_cabin_class FOREIGN KEY (cabin_class_id) REFERENCES cabin_class(cabin_class_id),
    ADD CONSTRAINT fk_fare_class_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_fare_class_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);



ALTER TABLE booking_status
    ADD CONSTRAINT fk_booking_status_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_booking_status_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE seat_status
    ADD CONSTRAINT fk_seat_status_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_seat_status_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE comfort_upgrade_type
    ADD CONSTRAINT fk_comfort_upgrade_type_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_comfort_upgrade_type_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE booking
    ADD CONSTRAINT fk_booking_passenger FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id),
    ADD CONSTRAINT fk_booking_status FOREIGN KEY (booking_status_id) REFERENCES booking_status(booking_status_id),
    ADD CONSTRAINT fk_booking_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_booking_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE booking_upgrade
    ADD CONSTRAINT fk_booking_upgrade_booking FOREIGN KEY (booking_id) REFERENCES booking(booking_id),
    ADD CONSTRAINT fk_booking_upgrade_type FOREIGN KEY (upgrade_id) REFERENCES comfort_upgrade_type(upgrade_id),
    ADD CONSTRAINT fk_booking_upgrade_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_booking_upgrade_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE seat
    ADD CONSTRAINT fk_seat_flight FOREIGN KEY (flight_id) REFERENCES flight(flight_id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_seat_cabin_class FOREIGN KEY (cabin_class_id) REFERENCES cabin_class(cabin_class_id),
    ADD CONSTRAINT fk_seat_status FOREIGN KEY (seat_status_id) REFERENCES seat_status(seat_status_id),
    ADD CONSTRAINT fk_seat_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_seat_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE baggage_status
    ADD CONSTRAINT fk_baggage_status_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_baggage_status_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE ticket
    ADD CONSTRAINT fk_ticket_seat FOREIGN KEY (flight_id, seat_number) REFERENCES seat (flight_id, seat_number),
    ADD CONSTRAINT fk_ticket_booking FOREIGN KEY (booking_id) REFERENCES booking(booking_id),
    ADD CONSTRAINT fk_ticket_passenger FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id),
    ADD CONSTRAINT fk_fare_class FOREIGN KEY (fare_class_id) REFERENCES fare_class(fare_class_id),
    ADD CONSTRAINT fk_ticket_flight FOREIGN KEY (flight_id) REFERENCES flight(flight_id),
    ADD CONSTRAINT fk_ticket_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_ticket_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE baggage
    ADD CONSTRAINT fk_baggage_ticket FOREIGN KEY (ticket_id) REFERENCES ticket(e_ticket_number) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_baggage_status FOREIGN KEY (baggage_status_id) REFERENCES baggage_status(baggage_status_id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_baggage_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_baggage_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE payment
    ADD CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES booking(booking_id),
    ADD CONSTRAINT fk_payment_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_payment_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE maintenance_status
    ADD CONSTRAINT fk_maintenance_status_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_maintenance_status_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE gate_status
    ADD CONSTRAINT fk_gate_status_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_gate_status_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE flight_status
    ADD CONSTRAINT fk_flight_status_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_flight_status_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE cabin_class
    ADD CONSTRAINT fk_cabin_class_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_cabin_class_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);


ALTER TABLE airport
    ADD CONSTRAINT fk_airport_created_by FOREIGN KEY (created_by) REFERENCES user(user_id),
    ADD CONSTRAINT fk_airport_updated_by FOREIGN KEY (updated_by) REFERENCES user(user_id);