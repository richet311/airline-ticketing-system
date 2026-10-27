-- boarding pass trigger, run after schema and seeds

USE airline_db;


-- sends the boarding pass to the inbox on check in
DROP TRIGGER IF EXISTS ticket_boarding_pass;

DELIMITER $$

CREATE TRIGGER ticket_boarding_pass
AFTER UPDATE ON ticket
FOR EACH ROW
BEGIN
    -- only if it wasnt checked in before (0 or null)
    IF IFNULL(OLD.checked_in, 0) = 0 AND NEW.checked_in = 1 THEN
        -- traveler gets it, or the booker for kids. guests dont get one
        INSERT INTO notification (user_id, notification_type, booking_id, flight_id, e_ticket_number,
                                  subject, body, created_by, created_at, updated_by, last_updated)
        SELECT COALESCE(tp.user_id, bp.user_id), 'BOARDING_PASS', NEW.booking_id, NEW.flight_id, NEW.e_ticket_number,
               CONCAT('Your boarding pass for ', f.flight_number),
               CONCAT('You''re checked in, ', tp.first_name, '. Show this boarding pass at the gate for ',
                      f.flight_number, ' from ', o.airport_code, ' to ', d.airport_code, '.'),
               NEW.updated_by, NOW(), NEW.updated_by, NOW()
          FROM booking b
          JOIN passenger tp ON tp.passenger_id = NEW.passenger_id
          JOIN passenger bp ON bp.passenger_id = b.passenger_id
          JOIN flight f     ON f.flight_id = NEW.flight_id
          JOIN airport o    ON o.airport_id = f.origin_airport_id
          JOIN airport d    ON d.airport_id = f.destination_airport_id
         WHERE b.booking_id = NEW.booking_id
           AND COALESCE(tp.user_id, bp.user_id) IS NOT NULL;
    END IF;
END$$

DELIMITER ;
