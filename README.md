# MAGS Resource Management System - UBLC

Paperless reservation and approval platform for rooms, venues, equipment, manpower, and gate passes.

**Database: SQLite** — no MySQL, PostgreSQL, or Docker required. Your client runs `npm install`, `npm run setup`, and `npm run dev`.

## Student / client quick start

```bash
cd burms
npm install
npm run setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

| Email | Password | Role |
|-------|----------|------|
| student@ub.edu.ph | Student@123 | Student |
| faculty@ub.edu.ph | Faculty@123 | Faculty |
| depthead@ub.edu.ph | Dept@123 | Department Head |
| mags@ub.edu.ph | Mags@123 | MAGS Officer |
| admin@ub.edu.ph | Admin@123 | Admin |

## Module documentation (for review)

Full guides for each part of the system:

| # | Module | Document |
|---|--------|----------|
| — | Overview & setup | [docs/00-getting-started.md](docs/00-getting-started.md) |
| 1 | Authentication | [docs/01-authentication.md](docs/01-authentication.md) |
| 2 | Dashboard | [docs/02-dashboard.md](docs/02-dashboard.md) |
| 3 | Venue reservations (F-MAGS LC-10) | [docs/03-venue-reservations.md](docs/03-venue-reservations.md) |
| 4 | Gate passes (F-MAGS LC-06) | [docs/04-gate-passes.md](docs/04-gate-passes.md) |
| 5 | Calendar & scheduling | [docs/05-calendar-scheduling.md](docs/05-calendar-scheduling.md) |
| 6 | Notifications | [docs/06-notifications.md](docs/06-notifications.md) |
| 7 | Equipment inventory | [docs/07-equipment.md](docs/07-equipment.md) |
| 8 | Administration | [docs/08-administration.md](docs/08-administration.md) |
| 9 | Reports & analytics | [docs/09-reports-analytics.md](docs/09-reports-analytics.md) |
| 10 | Approval workflow | [docs/10-approval-workflow.md](docs/10-approval-workflow.md) |

Start here: **[docs/README.md](docs/README.md)**

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Next.js API Routes, JWT (`jose`) |
| Database | **SQLite** + Prisma ORM (`prisma/burms.db`) |
| Calendar | FullCalendar |
| Documents | jsPDF, QR codes |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Create SQLite DB + seed demo data (first run) |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run db:studio` | Browse database (Prisma Studio) |

## Sending to a client

1. Zip the `burms` folder (include `prisma/burms.db` if already seeded).
2. Client runs the three commands above.
3. Point them to `docs/` for module-by-module review.

## Data location

- Database file: `prisma/burms.db`
- To reset: delete `prisma/burms.db` and run `npm run setup` again.

## License

Proprietary — University of Batangas / MAGS Office.
