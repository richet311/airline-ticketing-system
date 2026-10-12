"use server";

// Server Actions for /employee/agent/refunds (page.tsx in this folder).
// Functions in this file run on the server and can change the database.
// The page's forms call them: <form action={functionName}>.
// Each function must check that the person is allowed to make this change before it saves.
//
// To write here:
// - process a refund or fee: update the payment row's payment_status
