USE airline_db;


DROP TRIGGER IF EXISTS check_no_flight_change_after_departure;

DELIMITER $$

CREATE TRIGGER check_no_flight_change_after_departure
BEFORE UPDATE ON ticket
FOR EACH ROW
BEGIN
    IF NEW.flight_id <> OLD.flight_id
       AND (SELECT COUNT(*)
              FROM flight AS f
              JOIN flight_status AS fs ON fs.flight_status_id = f.flight_status_id
             WHERE f.flight_id IN (OLD.flight_id, NEW.flight_id)
               AND fs.flight_status_name IN ('DEPARTED', 'ARRIVED')) > 0
    THEN SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'This flight has already departed and can no longer be changed.';
    END IF;
END$$

DELIMITER ;
