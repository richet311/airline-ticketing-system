"use server";

// Server Actions for /register (page.tsx in this folder).
// Functions in this file run on the server and can change the database.
// The page's forms call them: <form action={functionName}>.
//
// To write here:
// - create account: a user row (store a password hash, never the password itself) and its
//   passenger row
