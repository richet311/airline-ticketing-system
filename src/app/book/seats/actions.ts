"use server";

// Server Actions for /book/seats (page.tsx in this folder).
// Functions in this file run on the server and can change the database.
// The page's forms call them: <form action={functionName}>.
// Each function must check that the person is allowed to make this change before it saves.
//
// To write here:
// - hold a seat: AVAILABLE -> HELD with held_until, in one transaction so two people can
//   never hold the same seat
// - release a held seat the traveler no longer wants (HELD -> AVAILABLE)
