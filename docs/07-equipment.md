# Module 07 — Equipment Inventory

## Purpose

The **Equipment** page lists items that can be requested with venue reservations or referenced on gate passes. It mirrors common MAGS inventory categories.

**URL:** `/equipment`

## Seeded equipment (demo)

- Microphone
- Sound System
- Projector
- Tables
- Chairs
- Podium
- Extension Cords

## How equipment connects to other modules

| Module | Connection |
|--------|------------|
| Venue reservation | Check equipment needed on `/reservations/new` |
| Gate pass | Describe equipment being brought in/out on `/gate-passes/new` |
| Profile | Save frequently used equipment details on `/profile` for quick-fill |
| Administration | Admins can add/edit resources via API or Prisma Studio |

## Services (related)

Manpower/services are selected on the reservation form, not this page:

- Tech Team
- Maintenance

See [03-venue-reservations.md](03-venue-reservations.md).

## For administrators

To add or edit equipment:

1. Log in as `admin@ub.edu.ph`
2. Go to **Administration → Resources**
3. Or use `npm run db:studio` to edit the `Resource` table (`category = EQUIPMENT`)

## Testing checklist

- [ ] View equipment list as student
- [ ] Create reservation with projector + chairs selected
- [ ] Confirm equipment appears on reservation detail page

## Related modules

- [03-venue-reservations.md](03-venue-reservations.md)
- [04-gate-passes.md](04-gate-passes.md)
- [08-administration.md](08-administration.md)
