# Module 03 — Venue Reservations (F-MAGS LC-10)

## Purpose

This module digitizes the **Venue Reservation** form (**F-MAGS LC-10**). Users request auditoriums, halls, labs, and other spaces for events. Approved requests can be printed as PDF copies for MAGS, BMD, and Security.

## Pages

| Page | URL | Who uses it |
|------|-----|-------------|
| List | `/reservations` | Everyone (own list; admins see more) |
| New request | `/reservations/new` | Students, faculty, staff |
| Detail | `/reservations/[id]` | Requestor and approvers |

## Form fields (aligned with LC-10)

| Field | Description |
|-------|-------------|
| Date of filing | Auto-set to today |
| Office / Department | Your college or office |
| Campus | UB campus location |
| Event | Event title and description |
| Date & time | Start and end (conflict-checked) |
| Venues | Checkboxes matching the paper form |
| Others — Specify | Custom room (e.g. Building A - Room 203) |
| Equipment | Microphone, projector, chairs, etc. |
| Services / Manpower | Tech team, maintenance |
| Items / personnel note | List of items or people needed |
| Conforme | Chief of office / representative name |

### Venue options (seeded)

Auditorium, Gymnasium, Multi Media Center, CAB Conference Room, Function Hall (MPH), UB Chapel, Learning Resource Center, Air conditioned rooms (must specify room), Conference Room, IE Lab, CPE Lab, Tiered Hall, Others.

## Status meanings

| Status | Meaning |
|--------|---------|
| PENDING_DEPT | Waiting for department head approval |
| PENDING_MAGS | Waiting for MAGS officer approval |
| APPROVED | Fully approved — PDFs available |
| REJECTED | Denied (see remarks) |
| CANCELLED | Cancelled by user or office |
| COMPLETED | Event finished |

## Conflict detection

When you submit, the system checks if the same **venue** is already booked for overlapping times. If there is a conflict, submission is blocked and conflicting request numbers are shown.

> Matches LC-10 reminder: approval is **first come, first served**.

## Printable PDFs (after approval)

On the reservation **detail** page, when status is **APPROVED**, download:

- **PDF — MAGS copy**
- **PDF — BMD's copy**
- **PDF — Security's copy**

Each PDF includes reminders (cleanliness, return equipment, 2-day cancellation notice) and conforme block.

## Step-by-step: student test

1. Log in as `student@ub.edu.ph` / `Student@123`
2. Go to **New Reservation**
3. Select department **CITEC**, campus, event name, future date/time
4. Check at least one venue (e.g. Gymnasium)
5. Add equipment if needed
6. Submit
7. Open **Reservations** — status should be **PENDING DEPT**
8. Log in as `depthead@ub.edu.ph` → **Administration → Approvals** → Approve
9. Log in as `mags@ub.edu.ph` → Approve again
10. As student, open reservation → download PDF

## Related modules

- [05-calendar-scheduling.md](05-calendar-scheduling.md) — See bookings on calendar
- [10-approval-workflow.md](10-approval-workflow.md) — Full approval chain
