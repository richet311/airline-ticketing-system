// TODO: one interface per table in schema.sql (extends RowDataPacket)
<<<<<<< Updated upstream
=======

//Create new interface for queries in the future that will join tables or pick only some columns.
import type { RowDataPacket } from "mysql2";

export interface Airport extends RowDataPacket {
    airport_id: number;
    airport_code: string;
    airport_name: string;
    city: string;
    country: string;
    timezone: string;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface Flight extends RowDataPacket {
    flight_id: number;
    flight_number: string;
    aircraft_id: number;
    origin_airport_id: number;
    destination_airport_id: number;
    departure_time: string;
    arrival_time: string;
    departure_gate_id: number | null;
    arrival_gate_id: number | null;
    flight_status_id: number;
    distance: number;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface FareClass extends RowDataPacket {
    fare_class_id: number;
    flight_id: number;
    cabin_class_id: number;
    base_price: number;
    seats_total: number;
    seats_available: number;
    is_refundable: 0 | 1;
    change_fee: number;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface Booking extends RowDataPacket {
    booking_id: string;
    passenger_id: number;
    booking_status_id: number;
    total_amount: number;
    currency: string;
    expires_at: string | null;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface User extends RowDataPacket {
    user_id: number;
    email: string;
    phone_number: string | null;
    password_hash: string;
    loyalty_points: number;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface Passenger extends RowDataPacket {
    passenger_id: number;
    user_id: number | null;
    passenger_parent_id: number | null;
    first_name: string | null;
    last_name: string | null;
    date_of_birth: string | null;
    passport_number: string | null;
    passport_expiry_date: string | null;
    nationality: string | null;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface Employee extends RowDataPacket {
    employee_id: number;
    user_id: number;
    first_name: string | null;
    last_name: string | null;
    date_of_birth: string | null;
    salary: number | null;
    direct_supervisor_id: number | null;
    assigned_gate_id: number | null;
    job_role_id: number;
    hire_date: string | null;
    is_active: 0 | 1;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface Department extends RowDataPacket {
    department_id: number;
    department_name: string;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface JobRole extends RowDataPacket {
    job_role_id: number;
    job_role_name: string;
    department_id: number | null;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface MaintenanceStatus extends RowDataPacket {
    maintenance_status_id: number;
    maintenance_status_name: string;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface GateStatus extends RowDataPacket {
    gate_status_id: number;
    gate_status_name: string;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface FlightStatus extends RowDataPacket {
    flight_status_id: number;
    flight_status_name: string;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface CabinClass extends RowDataPacket {
    cabin_class_id: number;
    cabin_class_name: string;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface Aircraft extends RowDataPacket {
    aircraft_id: number;
    aircraft_number: string;
    aircraft_type: string;
    capacity: number;
    maintenance_status_id: number;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface Terminal extends RowDataPacket {
    terminal_id: number;
    terminal_name: string;
    airport_id: number;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface Gate extends RowDataPacket {
    gate_id: number;
    gate_number: string;
    gate_status_id: number;
    terminal_id: number;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface BookingStatus extends RowDataPacket {
    booking_status_id: number;
    booking_status_name: string;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface SeatStatus extends RowDataPacket {
    seat_status_id: number;
    seat_status_name: string;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface BookingUpgrade extends RowDataPacket {
    upgrade_id: number;
    booking_id: string;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface UpgradeType extends RowDataPacket {
    upgrade_id: number;
    upgrade_name: string;
    upgrade_description: string;
    upgrade_price: number;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface Seat extends RowDataPacket {
    flight_id: number;
    seat_number: string;
    cabin_class_id: number;
    seat_status_id: number;
    held_until: string | null;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface BaggageStatus extends RowDataPacket {
    baggage_status_id: number;
    baggage_status_name: string;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface Ticket extends RowDataPacket {
    e_ticket_number: string;
    booking_id: string;
    passenger_id: number;
    flight_id: number;
    fare_class_id: number;
    seat_number: string | null;
    flight_fare: number;
    checked_in: 0 | 1 | null;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface Baggage extends RowDataPacket {
    tag_number: string;
    e_ticket_number: string | null;
    weightage: number; // pounds
    baggage_status_id: number;
    fee: number;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

export interface Payment extends RowDataPacket {
    payment_id: number;
    booking_id: string;
    // values from schema.sql's CHECK rules
    payment_status: "PENDING" | "RECEIVED" | "REFUNDED";
    total_amount: number;
    payment_method: "CREDIT" | "DEBIT" | "PAYPAL";
    idempotency_key: string;
    payment_time: string | null;
    created_at: string;
    last_updated: string;
    created_by: number;
    updated_by: number;
}

// Query result types (joins, or only some columns)

export interface AirportCity extends RowDataPacket {
    airport_code: string;
    city: string;
    country: string;
}

export interface AirportOption extends RowDataPacket {
  airport_code: string;
  city: string;
  country: string;
}

// /book/results: one flight
export interface FlightSearchResult extends RowDataPacket {
    flight_id: number;
    flight_number: string;
    departure_time: string;
    arrival_time: string;
    duration_min: number; // TIMESTAMPDIFF(MINUTE, departure_time, arrival_time)
    aircraft_type: string;
    flight_status_name: string;
}

// /book/results: one cabin's fare on a flight
export interface FareOption extends RowDataPacket {
    fare_class_id: number;
    flight_id: number;
    cabin_class_name: string;
    base_price: number;
    seats_available: number;
    is_refundable: 0 | 1;
}

// /flight-status
export interface FlightStatusRow extends RowDataPacket {
    flight_id: number;
    flight_number: string;
    origin: string;
    destination: string;
    departure_time: string;
    arrival_time: string;
    duration_min: number; // TIMESTAMPDIFF(MINUTE, departure_time, arrival_time)
    flight_status_name: string;
}

// /book/seats: one seat on the map
export interface SeatMapRow extends RowDataPacket {
    seat_number: string;
    cabin_class_name: string;
    seat_status_name: string;
}

// /book/confirmation
export interface BookingSummary extends RowDataPacket {
    booking_id: string;
    booking_status_name: string;
    total_amount: number;
    currency: string;
    created_at: string;
}

// /book/confirmation: one ticket with its traveler, flight and bags
export interface ConfirmationTicket extends RowDataPacket {
    e_ticket_number: string;
    passenger_id: number;
    first_name: string | null;
    last_name: string | null;
    seat_number: string | null;
    flight_fare: number;
    flight_id: number;
    flight_number: string;
    departure_time: string;
    arrival_time: string;
    origin: string;
    destination: string;
    cabin_class_name: string;
    bag_count: number;
    bag_fees: number;
}
>>>>>>> Stashed changes
