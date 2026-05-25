import { UserRole } from "@prisma/client";

export const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: "Student",
  FACULTY: "Faculty",
  STAFF: "Staff",
  DEPT_HEAD: "Department Head",
  MAGS_OFFICER: "MAGS Officer",
  ADMIN: "Administrator",
};

export function canManageUsers(role: UserRole) {
  return role === "ADMIN";
}

export function canManageResources(role: UserRole) {
  return role === "ADMIN" || role === "MAGS_OFFICER";
}

export function canApproveDept(role: UserRole) {
  // Faculty and Staff can also approve department-level reservations
  return role === "DEPT_HEAD" || role === "ADMIN" || role === "FACULTY" || role === "STAFF";
}

export function canApproveMags(role: UserRole) {
  return role === "MAGS_OFFICER" || role === "ADMIN";
}

export function canViewAllReservations(role: UserRole) {
  // Faculty can view all reservations in their department
  return ["ADMIN", "MAGS_OFFICER", "DEPT_HEAD", "FACULTY", "STAFF"].includes(role);
}

export function canAccessAdmin(role: UserRole) {
  // Faculty and Dept Head can access admin approvals area
  return role === "ADMIN" || role === "MAGS_OFFICER" || role === "DEPT_HEAD" || role === "FACULTY";
}

export function canCreateReservation(role: UserRole) {
  return ["STUDENT", "FACULTY", "STAFF", "DEPT_HEAD", "MAGS_OFFICER", "ADMIN"].includes(role);
}

export function canRequestGatePass(role: UserRole) {
  return ["STUDENT", "FACULTY", "STAFF", "DEPT_HEAD", "ADMIN"].includes(role);
}

export function canViewReports(role: UserRole) {
  return role === "ADMIN" || role === "MAGS_OFFICER";
}
