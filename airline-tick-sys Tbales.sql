CREATE TABLE booking(
    booking_id CHAR(6) PRIMARY KEY,
    passenger_id INT NOT NULL,
    booking_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    comfort_upgrade DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPZ NOT NULL DEFAULT now(); --might need to change the name so there isnt double created_at
    expires_at TIMESTAMPZ,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    -- CONSTRAINT fk_booking_passenger
    --     FOREIGN KEY (passenger_id)
    --     REFERENCES passenger(passenger_id)

    CONSTRAINT chk_booking_status
        CHECK (booking_status IN 
        ('Pending', 'Confirmed', 'Cancelled', 'Completed')),
    
    CONSTRAINT chk_booking_total --checks total_amount
        CHECK (total_amount >= 0),

    CONSTRAINT ch_booking_upgrade --checks comfort_upgrade
        CHECK (comfort_upgrade >= 0)

);

CREATE TABLE comfort_upgrade_type( --Categories of comfort_upgrade (Code table for booking comfort upgrades)
    upgrade_id INT PRIMARY KEY,
    upgrade_name VARCHAR(50) NOT NULL,
    upgrade_description VARCHAR(255) NOT NULL,
    upgrade_price DECIMAL(5, 2) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT chk_upgrade_price 
        CHECK (updrade_price >= 0)

    --Possible contraint??? (distinguish the type of upgrades a passenger might want to purchase?)
    --CONSTRAINT chk_upgrade_name
    --    CHECK (upgrade_name IN 
    --    ('Extra Legroom', 'Priority Boarding', 'In-flight Meal', 'Wi-Fi Access', 'Lounge Access', 'Seat Selection', 'Additional Baggage Allowance'))
);



CREATE TABLE seat(
    seat_id INT PRIMARY KEY,
    flight_id INT NOT NULL,
    seat_number VARCHAR(4) NOT NULL,
    cabin_class VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Available',
    held_until TIMESTAMP NULL,
    ticket_id INT NULL

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    CONSTRAINT uq_flight_seat
    UNIQUE (flight_id, seat_number)

    --CONSTRAINT fk_seat_flight
    --    FOREIGN KEY (flight_id)
    --    REFERENCES flight(flight_id),
    --    ON DELETE CASCADE,

    --CONSTRAINT fk_cabin_class
    --    FOREIGN KEY (cabin_class)
    --    REFERENCES seat_class_type(cabin_class),

    --CONSTRAINT fk_seat_ticket
    --    FOREIGN KEY (ticket_id)
    --    REFERENCES ticket(ticket_id)
    --    ON DELETE SET NULL

    CONSTRAINT chk_seat_status
        CHECK (seat_status IN
        ('AVAILABLE', 'HELD', 'BOOKED',' BLOCKED'))
);

CREATE TABLE cabin_class_type( --Code table for cabin classes
    seat_class_id INT PRIMARY KEY,
    seat_class_name VARCHAR(30) NOT NULL,
    seat_class_description VARCHAR(255) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT NOT NULL

    CONSTRAINT chk_seat_class_name
        CHECK (seat_class_name IN 
        ('Economy', 'Premium Economy', 'Business', 'First Class'))
);