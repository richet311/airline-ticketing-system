"use server";

// Server Actions for /my-trips/[bookingId]/change (page.tsx in this folder).
// Functions in this file run on the server and can change the database.
// The page's forms call them: <form action={functionName}>.
// Each function must check that the person is allowed to make this change before it saves.
//
// To write here:
// - change flight: before the cutoff, move the ticket to the new flight and seat, free the
//   old seat, and record the change fee as a payment row
