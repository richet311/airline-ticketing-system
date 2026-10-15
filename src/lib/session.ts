// Signed-in user helpers. Not written yet: this file only describes what goes here.
// Used by: the login and register actions, the "my" pages (my-trips, account, loyalty),
// the whole employee portal, and every action's permission check.
// Whoever builds login writes this file first, because everyone else depends on it.
//
// Start the file with: import "server-only";
//
// Decide as a team first:
// - How a login is remembered. Either a cookie holding a random session ID that is saved in a
//   new session table (add it to schema.sql and the seeds), or a signed cookie holding the
//   user_id (needs a secret key in .env.local and .env.example). Never put a password in a cookie.
// - How passwords are hashed. Node's built-in crypto (scrypt with a random salt) needs no new
//   package. The seed users still have plain-text passwords in user.password_hash, so update
//   Tier0Seed.sql once this is decided.
//
// To write here:
// - hashPassword(password): returns the text to store in user.password_hash (register).
// - checkPassword(password, storedHash): true when they match (login).
// - startSession(userId): called by the login and register actions; sets the cookie.
// - endSession(): called by Sign out; deletes the cookie (and the session row, if there is one).
// - getCurrentUser(): the signed-in user's row (user_id, email, loyalty_points), or null for a guest.
// - getSignedInEmployee(): the employee row for the signed-in user (employee_id, job_role_id,
//   assigned_gate_id), or null when the user is not an employee or is_active = 0.
//
// Notes:
// - cookies() comes from "next/headers" and must be awaited.
// - Setting or deleting a cookie only works inside a Server Action (an actions.ts function).
// - Reading the cookie counts as request data, like params: a page that calls getCurrentUser()
//   must call it inside <Suspense>.
// - Next.js guide: node_modules/next/dist/docs/01-app/02-guides/authentication.md
//   ("Session Management" covers both kinds of cookie).
