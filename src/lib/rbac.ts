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
  return role === "DEPT_HEAD" || role === "ADMIN";
}

export function canApproveMags(role: UserRole) {
  return role === "MAGS_OFFICER" || role === "ADMIN";
}

export function canViewAllReservations(role: UserRole) {
  return ["ADMIN", "MAGS_OFFICER", "DEPT_HEAD", "STAFF"].includes(role);
}

export function canAccessAdmin(role: UserRole) {
  return role === "ADMIN" || role === "MAGS_OFFICER";
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
