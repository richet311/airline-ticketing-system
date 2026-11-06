# Azure Air: Airline Ticketing System

A database class project: customers search, book, check in and manage flights, and staff run the airline from a role-based portal. Built with MySQL, Next.js and TypeScript.

## Run it locally

1. Install MySQL, Node.js and pnpm, then run `pnpm install`.
2. Copy `.env.example` to `.env.local` and fill in your MySQL password and a `SESSION_SECRET`.
3. Build the database (this wipes the local `airline_db`):

   ```
   powershell -ExecutionPolicy Bypass -File database\reset-demo.ps1
   ```

4. Run `pnpm dev` and open http://localhost:3000. For a demo, use `pnpm build` then `pnpm start`.

Flight times are set relative to when the seeds run, so reset the database shortly before a demo. Check-in stays open on AZ350 for about 19 hours after a reset, and AZ640 stays in Boarding for about 35 minutes.

Demo logins are in `database/seed/Tier0Seed.sql` (emails and passwords) and `database/seed/Tier2Seed.sql` (employee IDs 2001 to 2004).

## Project requirements

| Requirement | Where it is |
| --- | --- |
| Authentication for roles | `src/lib/session.ts`, `src/lib/roles.ts`, `src/proxy.ts`. Customers plus System Administrator, Operations Manager, Customer Service Agent and Gate Agent |
| Add, modify and delete forms | Admin dashboard (aircraft, airports, flights), customer booking, change and cancel, agent bookings |
| Triggers | 11 triggers and 1 scheduled event in `database/schema.sql` |
| Data queries | Flight search, flight status, trip lookup, agent booking search |
| Data reports | Revenue, Operations and Customers in `src/app/employee/admin/reports` |

## Folders

- `database/`: `schema.sql` (28 tables, triggers, event), seed files, and one `.sql` file per newer trigger for adding it to an existing database
- `src/app/`: pages and server actions
- `src/components/`: UI pieces
- `src/lib/`: database, login, business rules and shared helpers
