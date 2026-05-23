# Module 10 — Approval Workflow

## Purpose

This document explains the **complete approval chain** for venue reservations and gate passes — the core business process of MAGS Resource Management System - UBLC.

## Venue reservation workflow

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────┐
│   Requestor │────▶│  PENDING_DEPT    │────▶│  PENDING_MAGS    │────▶│ APPROVED │
│  (submit)   │     │  Dept Head       │     │  MAGS Officer    │     │  + PDF   │
└─────────────┘     └──────────────────┘     └──────────────────┘     └──────────┘
       │                     │                         │
       │                     ▼                         ▼
       │               REJECTED                  REJECTED
       └─────────────────────────────────────────────────
```

### Step 1 — Submit (Requestor)

- **Who:** Student, faculty, or staff
- **Where:** `/reservations/new`
- **Result:** Status `PENDING_DEPT`
- **Side effect:** Notification to department head(s)

### Step 2 — Department approval (Dept Head)

- **Who:** `DEPT_HEAD` for the same department (or Admin)
- **Where:** `/admin/approvals`
- **Approve:** Status → `PENDING_MAGS`; notification to MAGS
- **Reject:** Status → `REJECTED`; notification + (optional) email to requestor

### Step 3 — MAGS approval (MAGS Officer)

- **Who:** `MAGS_OFFICER` or Admin
- **Where:** `/admin/approvals`
- **Approve:** Status → `APPROVED`; requestor notified; PDFs enabled; (optional) email sent
- **Reject:** Status → `REJECTED`; requestor notified; (optional) email sent

### Step 4 — Use & conforme

- Requestor prints PDF copies (MAGS, BMD, Security)
- Chief of office signs conforme (name captured on form)
- Observe LC-10 reminders (cleanliness, return equipment, 2-day cancellation rule)

## Gate pass workflow

```
┌─────────────┐     ┌──────────┐     ┌──────────┐
│  Requestor  │────▶│ PENDING  │────▶│ APPROVED │
│  (submit)   │     │  (MAGS)  │     │ PDF + QR │
└─────────────┘     └──────────┘     └──────────┘
                           │
                           ▼
                      REJECTED
```

- **Single approval level:** MAGS Officer or Admin only
- No department step (per LC-06 practice)
- QR data format: `MAGS-GP:{passNumber}:{id}`

## Approval log (audit trail)

Each action is stored in **ApprovalLog**:

- Level: `DEPT_HEAD`, `MAGS_OFFICER`, or `DIRECTOR`
- Status: `PENDING`, `APPROVED`, `REJECTED`
- Remarks, signature name, timestamp

Visible on reservation detail under **Approval Trail**.

## Role quick reference

| Action | Student | Faculty | Dept Head | MAGS | Admin |
|--------|---------|---------|-----------|------|-------|
| Submit reservation | ✓ | ✓ | ✓ | ✓ | ✓ |
| Approve dept level | — | — | ✓ | — | ✓ |
| Approve MAGS level | — | — | — | ✓ | ✓ |
| Submit gate pass | ✓ | ✓ | ✓ | — | ✓ |
| Approve gate pass | — | — | — | ✓ | ✓ |
| Manage users | — | — | — | — | ✓ |
| View reports | — | — | — | ✓ | ✓ |

## Full end-to-end test script

1. **student@ub.edu.ph** — Submit venue reservation for next week
2. **depthead@ub.edu.ph** — Approve with signature name
3. **mags@ub.edu.ph** — Approve with “Editha E. Sevilleja” or custom signature
4. **student@ub.edu.ph** — Download all three PDF copies
5. **student@ub.edu.ph** — Submit gate pass
6. **mags@ub.edu.ph** — Approve gate pass
7. **student@ub.edu.ph** — Download gate pass PDF; verify QR displays

## Related modules

- [03-venue-reservations.md](03-venue-reservations.md)
- [04-gate-passes.md](04-gate-passes.md)
- [06-notifications.md](06-notifications.md)
- [08-administration.md](08-administration.md)
