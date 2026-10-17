// Status ids from the seed files. Use these instead of typing bare numbers.
// Update this file if the seeds change.

// Tier1Seed.sql

export const BOOKING_STATUS = {
  PENDING: 1,
  CONFIRMED: 2,
  CANCELLED: 3,
} as const;

export const SEAT_STATUS = {
  AVAILABLE: 1,
  HELD: 2,
  BOOKED: 3,
  BLOCKED: 4,
} as const;

export const FLIGHT_STATUS = {
  SCHEDULED: 1,
  DELAYED: 2,
  BOARDING: 3,
  DEPARTED: 4,
  ARRIVED: 5,
  CANCELLED: 6,
} as const;

export const BAGGAGE_STATUS = {
  CHECKED: 1,
  LOADED: 2,
  IN_TRANSIT: 3, // 'IN TRANSIT' (with a space) in the table
  ARRIVED: 4,
  LOST: 5,
} as const;

export const GATE_STATUS = {
  AVAILABLE: 1,
  OCCUPIED: 2,
  MAINTENANCE: 3,
} as const;

export const MAINTENANCE_STATUS = {
  OPERATIONAL: 1,
  MAINTENANCE: 2,
  GROUNDED: 3,
} as const;

export const CABIN_CLASS = {
  ECONOMY: 1,
  PREMIUM: 2,
  BUSINESS: 3,
  FIRST: 4,
} as const;

// Tier2Seed.sql

export const JOB_ROLE = {
  SYSTEM_ADMINISTRATOR: 91,
  OPERATIONS_MANAGER: 92,
  AIRPLANE_PILOT: 93,
  FLIGHT_ATTENDANT: 94,
  CUSTOMER_SERVICE_AGENT: 95,
  GATE_AGENT: 96,
  TARMAC_AGENT: 97,
} as const;

// schema.sql CHECK values (text, not ids)

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  RECEIVED: "RECEIVED",
  REFUNDED: "REFUNDED",
} as const;

export const PAYMENT_METHOD = {
  CREDIT: "CREDIT",
  DEBIT: "DEBIT",
  PAYPAL: "PAYPAL",
} as const;

type ValueOf<T> = T[keyof T];

export type BookingStatusId = ValueOf<typeof BOOKING_STATUS>;
export type SeatStatusId = ValueOf<typeof SEAT_STATUS>;
export type FlightStatusId = ValueOf<typeof FLIGHT_STATUS>;
export type BaggageStatusId = ValueOf<typeof BAGGAGE_STATUS>;
export type GateStatusId = ValueOf<typeof GATE_STATUS>;
export type MaintenanceStatusId = ValueOf<typeof MAINTENANCE_STATUS>;
export type CabinClassId = ValueOf<typeof CABIN_CLASS>;
export type JobRoleId = ValueOf<typeof JOB_ROLE>;
export type PaymentStatus = ValueOf<typeof PAYMENT_STATUS>;
export type PaymentMethod = ValueOf<typeof PAYMENT_METHOD>;

// An expired HELD seat (held_until in the past) counts as AVAILABLE.
