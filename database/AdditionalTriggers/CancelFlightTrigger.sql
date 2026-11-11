USE airline_db;


DROP TRIGGER IF EXISTS check_no_cancel_after_departure;

DELIMITER $$

CREATE TRIGGER check_no_cancel_after_departure
BEFORE UPDATE ON flight
FOR EACH ROW
BEGIN
    IF NEW.flight_status_id = (SELECT flight_status_id FROM flight_status WHERE flight_status_name = 'CANCELLED')
       AND OLD.flight_status_id IN (SELECT flight_status_id FROM flight_status
                                     WHERE flight_status_name IN ('DEPARTED', 'ARRIVED'))
    THEN SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'This flight has already departed and cannot be cancelled.';
    END IF;
END$$

DELIMITER ;
