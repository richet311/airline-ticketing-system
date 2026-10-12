"use server";

// Server Actions for /employee/admin/flights/new (page.tsx in this folder).
// Functions in this file run on the server and can change the database.
// The page's forms call them: <form action={functionName}>.
// Each function must check that the person is allowed to make this change before it saves.
//
// To write here:
// - schedule (publish) a flight: in one transaction, the flight row, its fare_class rows,
//   and one seat row per seat built from the aircraft's seat_layout_config
