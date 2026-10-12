"use server";

// Server Actions for /my-trips/[bookingId]/cancel (page.tsx in this folder).
// Functions in this file run on the server and can change the database.
// The page's forms call them: <form action={functionName}>.
// Each function must check that the person is allowed to make this change before it saves.
//
// To write here:
// - cancel: before the cutoff, in one transaction: booking CANCELLED, its seats AVAILABLE
//   again, seats_available back up, and a refund payment row. Never delete rows.
