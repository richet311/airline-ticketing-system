"use server";

// Server Actions for /employee/agent/bookings/[bookingId] (page.tsx in this folder).
// Functions in this file run on the server and can change the database.
// The page's forms call them: <form action={functionName}>.
// Each function must check that the person is allowed to make this change before it saves.
//
// To write here:
// - rebook onto another flight
// - change a seat
// - add a bag or a fee (a payment row)
// - cancel and refund (same steps as a customer cancel). Waiving a change fee needs
//   supervisor approval.
