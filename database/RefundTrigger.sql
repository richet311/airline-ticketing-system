USE airline_db;


DROP TRIGGER IF EXISTS check_no_refund_after_departure;

DELIMITER $$

CREATE TRIGGER check_no_refund_after_departure
BEFORE UPDATE ON booking
FOR EACH ROW
BEGIN
    IF NEW.booking_status_id = (SELECT booking_status_id FROM booking_status WHERE booking_status_name = 'CANCELLED')
       AND NEW.booking_status_id <> OLD.booking_status_id
       AND (SELECT COUNT(*)
              FROM ticket AS t
              JOIN flight AS f ON f.flight_id = t.flight_id
              JOIN flight_status AS fs ON fs.flight_status_id = f.flight_status_id
             WHERE t.booking_id = NEW.booking_id
               AND fs.flight_status_name IN ('DEPARTED', 'ARRIVED')) > 0
    THEN SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'This flight has already departed and can no longer be refunded.';
    END IF;
END$$

DELIMITER ;
