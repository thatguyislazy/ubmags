# Module 09 — Reports & Analytics

## Purpose

**Reports** help MAGS and administrators understand how campus resources are used: busiest venues, equipment demand, department activity, and approval backlog.

**URL:** `/admin/reports`

**Role required:** MAGS Officer or Admin

## Dashboard metrics

| Metric | Description |
|--------|-------------|
| Total Reservations | Count in selected period |
| Approved | Successfully approved count |
| Pending Approvals | Current queue (all time) |
| Gate Passes | Gate passes filed in period |
| Approval rate | Approved ÷ total (percentage) |

## Charts and tables

- **Most used venues** — Bar chart of reservation frequency by venue
- **Department activity** — Which colleges/offices book most often
- **Top equipment** — Most requested equipment items

## Export (current & planned)

| Format | Status |
|--------|--------|
| On-screen charts | ✓ Available |
| PDF export | Extensible via same jsPDF library used for forms |
| Excel export | Can be added to `/api/admin/reports?format=xlsx` |

For demos, use screenshots or Prisma Studio to export raw data from SQLite.

## Viewing raw data (advanced)

```bash
npm run db:studio
```

Opens Prisma Studio in the browser to browse `prisma/burms.db` tables directly.

## Testing checklist

- [ ] Log in as `mags@ub.edu.ph` or `admin@ub.edu.ph`
- [ ] Open Reports — confirm charts load after seed data exists
- [ ] Create several reservations with different venues
- [ ] Refresh reports and confirm top venues change

## Related modules

- [08-administration.md](08-administration.md)
- [03-venue-reservations.md](03-venue-reservations.md)
