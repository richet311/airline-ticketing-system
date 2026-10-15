// Display formatting. Not written yet: this file only describes what goes here.
// Used by every page that shows prices, dates or times, so they all look the same.
// These functions only turn values into text and never touch the database, so "use client"
// components can use them too.
//
// To write here:
// - formatMoney(amount, currency = "USD"): 653 -> "$653.00". Use Intl.NumberFormat.
// - formatDate("2026-12-15 13:00:00", "America/Chicago") -> "Dec 15, 2026"
// - formatTime("2026-12-15 13:00:00", "America/Chicago") -> "7:00 AM"
//   (the first value is UTC from the database, the second is airport.timezone)
//
// Notes:
// - Every time from the database is UTC text, like "2026-12-15 13:00:00" (team rule 6 in
//   schema.sql). Read it as UTC: replace the space with "T" and add "Z"
//   ("2026-12-15T13:00:00Z"). Without the "Z", JavaScript reads it as this computer's time.
// - Show flight times in the airport's local time: pass airport.timezone (for example
//   "America/Chicago") as the timeZone option of Intl.DateTimeFormat. Use the departure
//   airport's zone for departure_time and the arrival airport's zone for arrival_time.
