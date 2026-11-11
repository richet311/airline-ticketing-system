USE airline_db;


ALTER TABLE notification DROP CHECK check_notification_type;
ALTER TABLE notification
    ADD CONSTRAINT check_notification_type CHECK (notification_type IN ('ETICKET', 'BOARDING_PASS', 'DELAYED', 'CANCELLED', 'REFUND'));

DROP TRIGGER IF EXISTS refund_inbox_message;

DELIMITER $$

CREATE TRIGGER refund_inbox_message
AFTER INSERT ON payment
FOR EACH ROW
BEGIN
    IF NEW.payment_status = 'REFUNDED' THEN
        INSERT INTO notification (user_id, notification_type, booking_id, subject, body,
                                  created_by, created_at, updated_by, last_updated)
        SELECT bp.user_id, 'REFUND', b.booking_id,
               IF(bs.booking_status_name = 'CANCELLED',
                  CONCAT('Booking ', b.booking_id, ' cancelled'),
                  CONCAT('Refund for booking ', b.booking_id)),
               CONCAT(IF(bs.booking_status_name = 'CANCELLED', CONCAT('Your booking ', b.booking_id, ' is cancelled. '), ''),
                      'A refund of $', FORMAT(NEW.total_amount, 2), ' is on its way to your original payment method.'),
               NEW.created_by, NOW(), NEW.created_by, NOW()
          FROM booking b
          JOIN booking_status bs ON bs.booking_status_id = b.booking_status_id
          JOIN passenger bp      ON bp.passenger_id = b.passenger_id
         WHERE b.booking_id = NEW.booking_id
           AND bp.user_id IS NOT NULL;
    END IF;
END$$

DELIMITER ;
