# Module 02 — Dashboard

## Purpose

The **Dashboard** is the home screen after login. It shows a quick summary of your reservations, gate passes, and pending work based on your **role**.

**URL:** `/dashboard`

## What you see (all roles)

- **Welcome banner** — Your name and role
- **Stat cards** — Counts with links to detailed pages
- **Recent reservations** — Last few venue requests
- **Recent gate passes** — Last few gate pass requests

## Stat cards by role

| Card | Student / Faculty | Dept Head | MAGS / Admin |
|------|-------------------|-----------|--------------|
| My Reservations | ✓ | ✓ | ✓ |
| Gate Passes | ✓ | ✓ | ✓ |
| Pending Approvals | — | ✓ | ✓ |
| Approved | ✓ | ✓ | ✓ |

## Common actions from dashboard

| Button | Goes to |
|--------|---------|
| New Request (reservations card) | `/reservations/new` |
| Request Pass (gate passes card) | `/gate-passes/new` |
| View reservation row | `/reservations/[id]` |
| My Profile (sidebar) | `/profile` |

## Notifications bell

The header shows a **bell icon** with unread count. Click it to open `/notifications`.

## Testing checklist

- [ ] Log in as **student** — confirm no “Pending Approvals” card (or zero)
- [ ] Log in as **depthead@ub.edu.ph** — confirm Pending Approvals appears
- [ ] Click each stat card and confirm correct page opens
- [ ] Submit a new reservation and confirm it appears under Recent Reservations after refresh

## Related modules

- [03-venue-reservations.md](03-venue-reservations.md)
- [04-gate-passes.md](04-gate-passes.md)
- [06-notifications.md](06-notifications.md)
 - [08-administration.md](08-administration.md)
