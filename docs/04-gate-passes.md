# Module 04 — Gate Passes (F-MAGS LC-06)

## Purpose

The **Gate Pass** module implements **F-MAGS LC-06** for bringing equipment in or out of campus. Security can verify approved passes via **PDF** and **QR code**.

## Pages

| Page | URL |
|------|-----|
| List | `/gate-passes` |
| New request | `/gate-passes/new` |
| Detail | `/gate-passes/[id]` |

## Form fields (aligned with LC-06)

| Field | Description |
|-------|-------------|
| Date filed | Auto-set |
| Name | Requestor full name |
| Course | Student course (if applicable) |
| SN | Student number |
| Type / kind of equipment | e.g. Laptop, Camera |
| Description | Additional details |
| Brand | Equipment brand |
| Serial no. | Serial number |
| Model | Model name |
| Purpose | Why equipment is brought in/out |
| Date/time of entry | When entering campus |
| Date/time of pull-out | When leaving with equipment |

## Approval

Only **MAGS Officer** or **Admin** can approve gate passes.

After approval:

- Status becomes **APPROVED**
- **Download PDF** button appears
- **QR code** is embedded for verification

Default approver name on PDF: **Editha E. Sevilleja** (MAGS Officer), per the official form.

## Status meanings

| Status | Meaning |
|--------|---------|
| PENDING | Awaiting MAGS approval |
| APPROVED | Valid for entry/exit — print PDF |
| REJECTED | Denied |
| ACTIVE / RETURNED / EXPIRED | Lifecycle after use (future tracking) |

## Step-by-step: student test

1. Log in as `student@ub.edu.ph`
2. Go to **Gate Passes → New Gate Pass**
3. (Optional) Use **Quick fill from Profile** to load saved serial numbers/models automatically
4. Name and SN may pre-fill from your profile
5. Fill purpose, entry and pull-out times (equipment fields may already be filled)
6. Submit — status **PENDING**
7. Log in as `mags@ub.edu.ph` → **Approvals** → Approve gate pass
8. As student, open gate pass → **Download PDF** and view QR code

## Saved equipment profiles (no re-typing)

To avoid re-typing serial numbers every time:

1. Open **My Profile** (`/profile`)
2. Add a saved equipment profile (label, type, brand, serial, model)
3. Go back to **New Gate Pass** and select it under **Quick fill from Profile**

## Related modules

- [07-equipment.md](07-equipment.md) — Equipment catalog
- [10-approval-workflow.md](10-approval-workflow.md)
