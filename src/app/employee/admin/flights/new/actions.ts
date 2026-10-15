"use server";

// Server Actions for /employee/admin/flights/new (page.tsx in this folder).
// Functions in this file run on the server and can change the database.
// The page's forms call them: <form action={functionName}>.
// Each function must check that the person is allowed to make this change before it saves.
//
// To write here:
// - schedule (publish) a flight: in one transaction, the flight row, its fare_class rows,
//   and one seat row per seat. The aircraft only stores its capacity (there is no seat layout),
//   so decide how seats are laid out, for example rows, seats per row and premium rows chosen
//   in the form. The number of seats can't be more than aircraft.capacity, and each fare_class
//   seats_total must match its cabin's seats. Times are UTC (team rule 6 in schema.sql).
