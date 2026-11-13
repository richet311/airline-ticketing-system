USE airline_db;


DROP TRIGGER IF EXISTS check_aircraft_operational;

DELIMITER $$

CREATE TRIGGER check_aircraft_operational
BEFORE INSERT ON flight
FOR EACH ROW
BEGIN
    -- A new flight can only be scheduled on an aircraft that is OPERATIONAL (not in MAINTENANCE or GROUNDED)
    IF (SELECT ms.maintenance_status_name
          FROM aircraft AS a
          JOIN maintenance_status AS ms ON ms.maintenance_status_id = a.maintenance_status_id
         WHERE a.aircraft_id = NEW.aircraft_id) <> 'OPERATIONAL'
    THEN SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'This aircraft is not operational, so no flights can be scheduled on it.';
    END IF;
END$$

DELIMITER ;
