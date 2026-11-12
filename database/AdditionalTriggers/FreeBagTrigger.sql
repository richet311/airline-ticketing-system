USE airline_db;


DROP TRIGGER IF EXISTS apply_free_bag_perk;

DELIMITER $$

CREATE TRIGGER apply_free_bag_perk
BEFORE INSERT ON baggage
FOR EACH ROW
BEGIN
    -- Everyone's 1st checked bag is free. Gold and Platinum also get their tier's free_bags after that (2nd bag free).
    DECLARE v_spend DECIMAL(10,2);
    DECLARE v_free_bags INT DEFAULT 0;
    DECLARE v_bags_before INT;

    -- what the bag owner's account spent in the last 12 months (bag -> ticket -> passenger -> points history)
    SELECT COALESCE(SUM(pt.qualifying_spend), 0) INTO v_spend
      FROM ticket AS t
      JOIN passenger AS p           ON p.passenger_id = t.passenger_id
      JOIN points_transaction AS pt ON pt.user_id = p.user_id
     WHERE t.e_ticket_number = NEW.e_ticket_number
       AND pt.created_at >= NOW() - INTERVAL 12 MONTH;

    -- their tier is the highest one that spend reaches
    SELECT free_bags INTO v_free_bags
      FROM loyalty_tier
     WHERE min_qualifying_spend <= v_spend
     ORDER BY min_qualifying_spend DESC
     LIMIT 1;

    -- how many bags this ticket already has, so this one is bag number v_bags_before + 1
    SELECT COUNT(*) INTO v_bags_before FROM baggage WHERE e_ticket_number = NEW.e_ticket_number;

    -- the perk covers the bags after the free 1st one, up to the tier's free_bags
    IF NEW.fee > 0 AND v_bags_before >= 1 AND v_bags_before < 1 + v_free_bags THEN
        SET NEW.fee = 0;
    END IF;
END$$

DELIMITER ;
