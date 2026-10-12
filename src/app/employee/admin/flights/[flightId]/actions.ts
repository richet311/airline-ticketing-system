"use server";

// Server Actions for /employee/admin/flights/[flightId] (page.tsx in this folder).
// Functions in this file run on the server and can change the database.
// The page's forms call them: <form action={functionName}>.
// Each function must check that the person is allowed to make this change before it saves.
//
// To write here:
// - update the flight status (SCHEDULED, DELAYED, BOARDING, DEPARTED, ARRIVED, CANCELLED)
// - assign the aircraft and the departure and arrival gates
