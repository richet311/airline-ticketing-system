USE airline_db;


DROP TRIGGER IF EXISTS check_flight_not_oversold;
DROP TRIGGER IF EXISTS check_flight_not_oversold_on_change;

DELIMITER $$

CREATE TRIGGER check_flight_not_oversold
BEFORE INSERT ON ticket
FOR EACH ROW
BEGIN
    -- A flight can't sell more seated tickets than its aircraft has seats
    IF NEW.seat_number IS NOT NULL
       AND (SELECT COUNT(*) FROM ticket AS t WHERE t.flight_id = NEW.flight_id AND t.seat_number IS NOT NULL)
           >= (SELECT a.capacity FROM flight AS f JOIN aircraft AS a ON a.aircraft_id = f.aircraft_id WHERE f.flight_id = NEW.flight_id)
    THEN SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'This flight is sold out.';
    END IF;
END$$

CREATE TRIGGER check_flight_not_oversold_on_change
BEFORE UPDATE ON ticket
FOR EACH ROW
BEGIN
    -- Same rule for a ticket moving to a different flight (My Trips > Change flight)
    IF NEW.flight_id <> OLD.flight_id AND NEW.seat_number IS NOT NULL
       AND (SELECT COUNT(*) FROM ticket AS t WHERE t.flight_id = NEW.flight_id AND t.seat_number IS NOT NULL)
           >= (SELECT a.capacity FROM flight AS f JOIN aircraft AS a ON a.aircraft_id = f.aircraft_id WHERE f.flight_id = NEW.flight_id)
    THEN SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'This flight is sold out.';
    END IF;
END$$

DELIMITER ;
