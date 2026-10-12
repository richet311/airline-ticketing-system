"use server";

// Server Actions for /employee/admin/employees (page.tsx in this folder).
// Functions in this file run on the server and can change the database.
// The page's forms call them: <form action={functionName}>.
// Each function must check that the person is allowed to make this change before it saves.
//
// To write here:
// - add an employee (a user row + an employee row)
// - change an employee's role, gate or supervisor
// - deactivate an employee (is_active = 0); never delete
