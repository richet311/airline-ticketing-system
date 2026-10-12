"use server";

// Server Actions for /book/checkout (page.tsx in this folder).
// Functions in this file run on the server and can change the database.
// The page's forms call them: <form action={functionName}>.
// Each function must check that the person is allowed to make this change before it saves.
//
// To write here:
// - purchase: in one transaction, create the booking, one ticket per traveler per flight,
//   booking_upgrade and baggage rows, and the payment row; turn the held seats BOOKED and
//   lower fare_class.seats_available
