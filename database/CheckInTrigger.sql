USE airline_db;


DROP TRIGGER IF EXISTS check_no_check_in_after_departure;

DELIMITER $$

CREATE TRIGGER check_no_check_in_after_departure
BEFORE UPDATE ON ticket
FOR EACH ROW
BEGIN
    -- A passenger can't check in once the flight has left (or was cancelled)
    IF NEW.checked_in = 1 AND IFNULL(OLD.checked_in, 0) = 0
       AND (SELECT fs.flight_status_name
              FROM flight AS f
              JOIN flight_status AS fs ON fs.flight_status_id = f.flight_status_id
             WHERE f.flight_id = NEW.flight_id) IN ('DEPARTED', 'ARRIVED', 'CANCELLED')
    THEN SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'This flight has already left or was cancelled, so it can''t be checked in.';
    END IF;
END$$

DELIMITER ;
