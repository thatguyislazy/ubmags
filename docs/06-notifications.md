# Module 06 — Notifications

## Purpose

**Notifications** keep users informed about reservation and gate pass updates without checking every page manually.

**URL:** `/notifications`

## Notification types

| Type | When it is sent |
|------|-----------------|
| RESERVATION_UPDATE | New request submitted (to approvers) |
| APPROVAL | Request approved |
| REJECTION | Request rejected |
| SCHEDULE_REMINDER | Upcoming event (extensible) |
| RETURN_REMINDER | Equipment return due (extensible) |
| CONFLICT | Booking conflict (extensible) |
| SYSTEM | General announcements |

## Who receives what

| Event | Recipient |
|-------|-----------|
| Student submits reservation | Department head(s) of that department |
| Dept head approves | MAGS officers and admins |
| MAGS approves/rejects | Original requestor |
| Gate pass submitted | MAGS officers and admins |
| Gate pass decided | Requestor |

## Using the UI

1. Click the **bell** in the header (unread count badge).
2. Read notifications; unread items are highlighted.
3. Click **View details →** to open the related reservation or approval page.
4. Use **Mark all as read** to clear the unread state.

## Email / message notifications (optional SMTP)

The system always stores notifications in the database (in-app). It can also send **emails** when a request is **approved or declined**, if SMTP is configured.

Set these in `.env`:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER` (optional)
- `SMTP_PASS` (optional)
- `SMTP_SECURE` (`true` for 465, otherwise omit)
- `EMAIL_FROM` (required when SMTP enabled)

If SMTP is not configured, MAGS continues working normally (emails are skipped).

## Testing checklist

- [ ] Submit reservation as student — dept head should get notification
- [ ] Approve as dept head — MAGS user should get notification
- [ ] Final approve — student should get approval notification

## Related modules

- [10-approval-workflow.md](10-approval-workflow.md)
