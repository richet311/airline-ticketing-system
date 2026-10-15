"use server";

// Server Actions for /book/seats (page.tsx in this folder).
// Functions in this file run on the server and can change the database.
// The page's forms call them: <form action={functionName}>.
// Each function must check that the person is allowed to make this change before it saves.
//
// To write here:
// - hold a seat: AVAILABLE -> HELD with held_until, in one transaction so two people can
//   never hold the same seat
// - release a held seat the traveler no longer wants (HELD -> AVAILABLE). If a ticket already
//   points at that seat, set its seat_number to NULL in the same transaction. Do the same when
//   a hold's held_until has passed.
