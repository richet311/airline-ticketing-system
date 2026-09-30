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
