"use server";

// Server Actions for /employee/admin/aircraft (page.tsx in this folder).
// Functions in this file run on the server and can change the database.
// The page's forms call them: <form action={functionName}>.
// Each function must check that the person is allowed to make this change before it saves.
//
// To write here:
// - add and edit aircraft, their seat_layout_config and maintenance status
