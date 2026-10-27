-- flight delay/cancel trigger, run after schema and seeds

USE airline_db;


-- tells everyone on the flight when it gets delayed or cancelled
DROP TRIGGER IF EXISTS flight_status_alert;

DELIMITER $$

CREATE TRIGGER flight_status_alert
AFTER UPDATE ON flight
FOR EACH ROW
BEGIN
    DECLARE v_from CHAR(3);
    DECLARE v_to CHAR(3);

    -- only if the status changed to DELAYED (2) or CANCELLED (6)
    IF NEW.flight_status_id <> OLD.flight_status_id AND NEW.flight_status_id IN (2, 6) THEN
        SELECT airport_code INTO v_from FROM airport WHERE airport_id = NEW.origin_airport_id;
        SELECT airport_code INTO v_to FROM airport WHERE airport_id = NEW.destination_airport_id;

        -- one message per account per booking, so a parent w/ kids only gets one
        INSERT INTO notification (user_id, notification_type, booking_id, flight_id,
                                  subject, body, created_by, created_at, updated_by, last_updated)
        SELECT DISTINCT COALESCE(tp.user_id, bp.user_id),
               IF(NEW.flight_status_id = 2, 'DELAYED', 'CANCELLED'),
               b.booking_id, NEW.flight_id,
               IF(NEW.flight_status_id = 2,
                  CONCAT(NEW.flight_number, ' is delayed'),
                  CONCAT(NEW.flight_number, ' has been cancelled')),
               IF(NEW.flight_status_id = 2,
                  CONCAT('Your flight ', NEW.flight_number, ' from ', v_from, ' to ', v_to,
                         ' is delayed. Check Flight Status for the new departure time. We''re sorry for the wait.'),
                  CONCAT('Your flight ', NEW.flight_number, ' from ', v_from, ' to ', v_to,
                         ' has been cancelled. Contact us to rebook or get a refund.')),
               NEW.updated_by, NOW(), NEW.updated_by, NOW()
          FROM ticket t
          JOIN booking b    ON b.booking_id = t.booking_id
          JOIN passenger tp ON tp.passenger_id = t.passenger_id
          JOIN passenger bp ON bp.passenger_id = b.passenger_id
         WHERE t.flight_id = NEW.flight_id
           AND b.booking_status_id = 2
           AND COALESCE(tp.user_id, bp.user_id) IS NOT NULL;
    END IF;
END$$

DELIMITER ;
