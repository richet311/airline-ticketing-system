"use server";

// Server Actions for /login (page.tsx in this folder).
// Functions in this file run on the server and can change the database.
// The page's forms call them: <form action={functionName}>.
//
// To write here:
// - customer log in: check the email and password against user.password_hash, then start the
//   session
// - staff sign in: the same, by employee ID or work email; send agents to /employee/agent
//   and admins to /employee/admin
