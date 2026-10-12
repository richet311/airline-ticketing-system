"use server";

// Server Actions for /employee/agent/gate/[flightId] (page.tsx in this folder).
// Functions in this file run on the server and can change the database.
// The page's forms call them: <form action={functionName}>.
// Each function must check that the person is allowed to make this change before it saves.
//
// To write here:
// - board a passenger (ticket has no column for this yet: team decision)
// - check in a passenger at the gate (ticket.checked_in = 1)
// - gate-check a carry-on (a baggage row)
