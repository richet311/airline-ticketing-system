USE airline_db;


DROP TRIGGER IF EXISTS check_flight_status_order;

DELIMITER $$

CREATE TRIGGER check_flight_status_order
BEFORE UPDATE ON flight
FOR EACH ROW
BEGIN
    -- Statuses only move forward: a departed flight can only land, and arrived or cancelled flights are final
    DECLARE v_old VARCHAR(20);
    DECLARE v_new VARCHAR(20);

    IF NEW.flight_status_id <> OLD.flight_status_id THEN
        SELECT flight_status_name INTO v_old FROM flight_status WHERE flight_status_id = OLD.flight_status_id;
        SELECT flight_status_name INTO v_new FROM flight_status WHERE flight_status_id = NEW.flight_status_id;

        IF v_old = 'ARRIVED' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This flight has arrived, so its status can''t change.';
        ELSEIF v_old = 'CANCELLED' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A cancelled flight can''t be reopened. Schedule a new flight instead.';
        ELSEIF v_old = 'DEPARTED' AND v_new <> 'ARRIVED' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A departed flight can only move to Arrived.';
        END IF;
    END IF;
END$$

DELIMITER ;
