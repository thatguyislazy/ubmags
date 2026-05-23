export const CAMPUSES = [
  "Lipa",
] as const;

export const DEPARTMENTS = [
  { code: "BED", name: "Basic Education Department" },
  { code: "JHS", name: "Junior High School" },
  { code: "SHS", name: "Senior High School" },
  { code: "CCJE", name: "College of Criminal Justice Education (CCJE)" },
  { code: "CENAR", name: "College of Engineering and Architecture (CENAR)" },
  { code: "CITEC", name: "College of Information Technology and Computer Studies (CITEC)" },
  { code: "CMT", name: "College of Management and Tourism (CMT)" },
  { code: "LAW", name: "College of Law" },
  { code: "GS", name: "Graduate School" },
  { code: "CCELL", name: "Center for Continuing Education and Life-Long Learning (CCELL)" },
  { code: "ETEEAP", name: "ETEEAP – Expanded Tertiary Education Equivalency and Accreditation Program" },
] as const;

export const VENUE_FORM_OPTIONS = [
  "Auditorium",
  "Gymnasium",
  "Multi Media Center",
  "CAB Conference Room",
  "Function Hall",
  "UB Chapel",
  "Learning Resource Center",
  "Air conditioned rooms",
  "Conference Room",
  "Others",
] as const;

export const MAGS_OFFICER_NAME = "Editha E. Sevilleja";
export const DIRECTOR_ADMIN_NAME = "Mrs. Jeanina Faye C. Delos Reyes";

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING_DEPT: "bg-amber-100 text-amber-800",
  PENDING_MAGS: "bg-orange-100 text-orange-800",
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-600",
  COMPLETED: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  RETURNED: "bg-blue-100 text-blue-800",
  EXPIRED: "bg-gray-100 text-gray-600",
};
