# Module 00 — Getting Started

## Purpose

This guide helps you **install and run MAGS Resource Management System - UBLC** on Windows, macOS, or Linux with **no database server**. The app stores all data in a single SQLite file (`prisma/burms.db`).

## What you need

- **Node.js 20 or newer** — [https://nodejs.org](https://nodejs.org)
- A web browser (Chrome, Edge, or Firefox recommended)
- About 500 MB free disk space for `node_modules`

You do **not** need MySQL, PostgreSQL, XAMPP, or Docker.

## Installation steps

### 1. Open the project folder

Unzip the project if you received it as a ZIP. Open a terminal (Command Prompt or PowerShell) in the `burms` folder.

### 2. Install packages

```bash
npm install
```

### 3. First-time setup (database + demo data)

```bash
npm run setup
```

This command:

- Copies `.env.example` to `.env` if needed
- Creates `prisma/burms.db` (SQLite database)
- Seeds departments, venues, equipment, and demo user accounts

### 4. Start the application

```bash
npm run dev
```

Open **http://localhost:3001** in your browser.

### 5. Sign in

Use any demo account from the table below (see [01-authentication.md](01-authentication.md) for role details).

| Email | Password |
|-------|----------|
| student@ub.edu.ph | Student@123 |

## Main navigation (after login)

| Menu item | Path | Description |
|-----------|------|-------------|
| Dashboard | `/dashboard` | Summary and recent activity |
| Reservations | `/reservations` | Venue requests (LC-10) |
| New Reservation | `/reservations/new` | Submit a new venue request |
| Gate Passes | `/gate-passes` | Equipment gate passes (LC-06) |
| Calendar | `/calendar` | Visual schedule of bookings |
| Equipment | `/equipment` | List of borrowable equipment |
| Notifications | `/notifications` | System alerts |

**Administration** menu (Admin / MAGS Officer only): Users, Departments, Resources, Approvals, Reports.

## Resetting the database

If you want a clean slate:

1. Stop the app (Ctrl+C in the terminal).
2. Delete `prisma/burms.db`.
3. Run `npm run setup` again.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm` not found | Install Node.js and restart the terminal |
| Port 3001 in use | Run `npm run dev:3002` and open http://localhost:3002 |
| Database errors | Delete `prisma/burms.db` and run `npm run setup` |
| Blank page after login | Clear browser cookies for localhost and try again |

## Next steps

- Students testing requests → [03-venue-reservations.md](03-venue-reservations.md) and [04-gate-passes.md](04-gate-passes.md)
- Approvers → [10-approval-workflow.md](10-approval-workflow.md)
- Administrators → [08-administration.md](08-administration.md)
