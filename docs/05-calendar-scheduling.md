# Module 05 — Calendar & Scheduling

## Purpose

The **Calendar** shows approved and pending venue reservations on a visual timeline. It helps avoid **double booking** and lets staff see campus-wide activity.

**URL:** `/calendar`

## Views

Use the toolbar to switch:

- **Month** — Overview of all events
- **Week** — Time slots per day
- **Day** — Detailed hourly view

## Event colors (status)

| Color | Status |
|-------|--------|
| Green | Approved |
| Orange | Pending MAGS |
| Amber | Pending department |

## Interactions

- **Click an event** — Opens the reservation detail page
- Events show event title; hover/click for request number and department

## Real-time availability

The calendar updates automatically every 30 seconds and whenever you change the visible range (month/week/day).
You can also filter the calendar by a specific venue to see that room’s availability.

## Conflict prevention (behind the scenes)

When creating a reservation ([03-venue-reservations.md](03-venue-reservations.md)):

1. System loads overlapping bookings for selected venues
2. If overlap exists with PENDING or APPROVED requests, submission fails
3. User must choose different time or venue

## First come, first served

Documented on LC-10 PDF reminders. The calendar reflects bookings in submission/approval order; earlier approved bookings block later conflicting requests.

## Testing checklist

- [ ] Create two reservations for the **same venue** and **overlapping times** — second should fail
- [ ] Create non-overlapping bookings — both appear on calendar
- [ ] Approve a reservation and confirm it turns **green** on calendar

## Related modules

- [03-venue-reservations.md](03-venue-reservations.md)
- [10-approval-workflow.md](10-approval-workflow.md)
