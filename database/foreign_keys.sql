USE airline_db;


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
    ADD CONSTRAINT fk_ticket_seat FOREIGN KEY (flight,id, seat_number) REFERENCES seat (flight_id, seat_number),
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


ALTER TABLE maintenace_status
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