# Module 08 — Administration

## Purpose

**Administration** modules are for **Department Heads**, **MAGS Officers**, and **Admins** who manage users, organizational structure, resources, and pending approvals.

Access: sidebar section **Administration** (role-dependent).

## Sub-modules

### Approvals are processed electronically

Approvals and signatures are handled digitally:

- Approvers click **Approve** or **Reject** in `/admin/approvals`
- “Signature over printed name” is captured as a **typed name** (electronic signature)
- Remarks and timestamps are stored for audit and shown on the reservation detail page

### Users (`/admin/users`)

**Role required:** Admin

| Function | Description |
|----------|-------------|
| View all users | Name, email, role, department, active status |
| Create users | Via API `POST /api/admin/users` or Prisma Studio |

Typical use: create dept heads and MAGS officers who should not self-register.

### Departments (`/admin/departments`)

**Role required:** Admin

Shows all seeded colleges/offices:

- Basic Education, JHS, SHS
- CCJE, CENAR, CITEC, CMT, College of Law
- Graduate School, CCELL, ETEEAP

Each card shows user count and reservation count.

### Resources (`/admin/resources`)

**Role required:** Admin or MAGS Officer

Manage **venues**, **equipment**, and **services**:

- Name, category, active/inactive
- “Requires specify” for venues like air-conditioned rooms

Add new items via `POST /api/resources` or Prisma Studio.

### Approvals (`/admin/approvals`)

**Role required:** Dept Head, MAGS Officer, or Admin

Central inbox for:

- **Venue reservations** pending your level
- **Gate passes** pending MAGS approval

Actions: Approve / Reject with optional remarks and signature name.

See [10-approval-workflow.md](10-approval-workflow.md).

### Settings (`/admin/settings`)

**Role required:** Admin or MAGS Officer

Displays system references (form codes, default MAGS officer name, email configuration notes).

### Reports

See [09-reports-analytics.md](09-reports-analytics.md).

## F-MAGS LC-05 (Transfer / Turn-over)

The database includes **TransferTurnover** and **TransferItem** models for LC-05 (quantity, description, brand/serial, property number, transfer vs turn-over). A full UI can be added in a future version; schema and approval names match the paper form (MAGS Officer → Director of Administration Services).

## Testing checklist

- [ ] Admin: view all users and departments
- [ ] MAGS: open Resources and Approvals
- [ ] Dept head: Approvals shows only own department PENDING_DEPT items
- [ ] Admin: cannot access `/admin/users` as student (should redirect)

## Related modules

- [09-reports-analytics.md](09-reports-analytics.md)
- [10-approval-workflow.md](10-approval-workflow.md)
