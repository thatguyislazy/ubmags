# Module 01 — Authentication

## Purpose

MAGS Resource Management System - UBLC uses **secure login** so only authorized university members can request resources or approve requests. Each user has a **role** that controls what they can see and do.

## Features

| Feature | URL | Description |
|---------|-----|-------------|
| Login | `/login` | Email and password sign-in |
| Register | `/register` | Self-registration (Student, Faculty, Staff) |
| Forgot password | `/forgot-password` | Request a password reset link |
| Sign out | Sidebar → Sign out | Ends your session |

## User roles

| Role | Typical user | Main capabilities |
|------|--------------|---------------------|
| **Student** | Enrolled student | Request venues, gate passes; view own history |
| **Faculty** | Instructor | Same as student + department requests |
| **Staff** | Office staff | Create reservations, view schedules |
| **Department Head** | Dean / chief | Approve department reservations (1st level) |
| **MAGS Officer** | MAGS office | Final venue/gate pass approval, resources |
| **Admin** | System admin | Full access: users, reports, all approvals |

## Registration flow

1. Go to **Register** from the home page or `/register`.
2. Enter name, email, password, and **department** (required).
3. For **Student**: also enter **Student Number (SN)** and **Course** (matches F-MAGS LC-06 gate pass fields).
4. Submit — you are logged in automatically.

> Department heads, MAGS officers, and admins are usually created by an administrator, not self-registration.

## Login flow

1. Open `/login`.
2. Enter email and password.
3. You are redirected to the **Dashboard**.

## Password rules (registration)

- Minimum 8 characters
- At least one uppercase letter
- At least one number

## Security notes (for reviewers)

- Passwords are **hashed** (not stored in plain text).
- Sessions use **HTTP-only cookies** with JWT tokens.
- Protected pages redirect to login if you are not signed in.
- Admin routes check your role before allowing access.

## Testing checklist

- [ ] Register a new student account
- [ ] Log in as `student@ub.edu.ph`
- [ ] Log in as `depthead@ub.edu.ph` and confirm admin menu differs
- [ ] Log out and confirm `/dashboard` redirects to login
- [ ] Use forgot password and check terminal for dev reset link (if email not configured)

## Related modules

- [02-dashboard.md](02-dashboard.md) — After login
- [08-administration.md](08-administration.md) — Managing users (Admin)
