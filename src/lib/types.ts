// Row types: one interface per table in database/schema.sql.

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
    boarded: 0 | 1;
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

// session.ts getCurrentUser()
export interface CurrentUser extends RowDataPacket {
    user_id: number;
    email: string;
    loyalty_points: number;
    passenger_id: number | null;
    first_name: string | null;
    last_name: string | null;
}

// BOOLEAN columns come back as 0 or 1
export interface LoyaltyTier extends RowDataPacket {
    tier_id: number;
    tier_name: string;
    min_qualifying_spend: number;
    bonus_percent: number;
    free_bags: number;
    upgrade_discount_percent: number;
    priority_boarding: number;
    free_seat_choice: number;
}

// /loyalty recent activity
export interface PointsActivity extends RowDataPacket {
    transaction_id: number;
    booking_id: string | null;
    transaction_type: string;
    points: number;
    description: string | null;
    created_at: string;
}

// session.ts getSignedInEmployee() (active employees only)
export interface SignedInEmployee extends RowDataPacket {
    employee_id: number;
    user_id: number;
    first_name: string | null;
    last_name: string | null;
    job_role_id: number;
    job_role_name: string;
    assigned_gate_id: number | null;
}

// /employee/admin: aircraft list (aircraft joined to maintenance_status)
export interface AircraftListRow extends RowDataPacket {
    aircraft_id: number;
    aircraft_number: string;
    aircraft_type: string;
    capacity: number;
    maintenance_status_name: string;
}

// /employee/admin: flights list. The Flight Status columns plus the aircraft.
export interface AdminFlightRow extends FlightStatusRow {
    aircraft_number: string;
}

// What an admin "add" form's action sends back: an error with what was typed, or ok.
export type AdminFormState = { error: string; values: Record<string, string> } | { ok: true } | null;

// /employee/admin Scheduled flights: the flights list plus what the gate dropdowns need.
export interface OpsFlightRow extends AdminFlightRow {
    origin_airport_id: number;
    destination_airport_id: number;
    departure_gate_id: number | null;
    arrival_gate_id: number | null;
}

// A gate for the dropdowns: gate joined to terminal (which gives its airport) and gate_status.
export interface GateOption extends RowDataPacket {
    gate_id: number;
    airport_id: number;
    terminal_name: string;
    gate_number: string;
    gate_status_name: string;
}

// /employee Bookings tile: one ticket (a passenger on a flight) with its booking.
export interface BookingTicketRow extends RowDataPacket {
    e_ticket_number: string;
    booking_id: string;
    flight_id: number;
    fare_class_id: number;
    seat_number: string | null; // NULL once a cancelled booking gave its seat up
    flight_fare: number; // what this ticket cost (its fare's base_price when booked)
    first_name: string | null;
    last_name: string | null;
    flight_number: string;
    origin: string;
    destination: string;
    departure_time: string;
    origin_timezone: string; // airport.timezone of the origin, for local departure time
    flight_status_name: string;
    cabin_class_name: string;
    total_amount: number; // booking.total_amount
    paid_amount: number; // the booking's RECEIVED payments minus its REFUNDED ones
    booking_status_name: string;
}

// /employee Bookings tile: an AVAILABLE seat, and the fare (flight + cabin) it belongs to.
export interface AvailableSeatRow extends RowDataPacket {
    fare_class_id: number;
    seat_number: string;
}

// /employee Bookings tile: a fare on a booked flight. FareOption plus its change fee.
export interface AgentFareRow extends FareOption {
    change_fee: number;
}

// /employee Bookings tile: one checked bag on a ticket.
export interface TicketBagRow extends RowDataPacket {
    tag_number: string;
    e_ticket_number: string;
    weightage: number; // pounds
}

// /employee Gate tile: the flight being boarded, with both gates and their statuses.
export interface GateFlightRow extends RowDataPacket {
    flight_id: number;
    flight_number: string;
    origin: string;
    destination: string;
    origin_airport_id: number;
    destination_airport_id: number;
    departure_time: string;
    origin_timezone: string;
    flight_status_name: string;
    departure_gate_id: number | null;
    departure_gate: string | null; // "Terminal 1 · A26"
    departure_gate_status: string | null;
    arrival_gate_id: number | null;
    arrival_gate: string | null;
    arrival_gate_status: string | null;
}

// /employee Gate tile: one passenger on the flight (confirmed bookings only).
export interface GatePassengerRow extends RowDataPacket {
    e_ticket_number: string;
    seat_number: string | null;
    first_name: string | null;
    last_name: string | null;
    passport_number: string | null;
    bag_count: number;
    checked_in: 0 | 1 | null;
    boarded: 0 | 1;
}

// /employee/admin/reports
export interface RouteRevenueRow extends RowDataPacket {
    route: string;
    distance: number;
    flights: number;
    tickets: number;
    revenue: number;
    passenger_miles: number;
    revenue_per_100_miles: number;
}

export interface CabinRevenueRow extends RowDataPacket {
    cabin: string;
    tickets: number;
    revenue: number;
    average_fare: number;
    revenue_share: number;
}

export interface DailyRevenueRow extends RowDataPacket {
    day: string;
    received: number;
    refunded: number;
    net: number;
    running_total: number;
}
