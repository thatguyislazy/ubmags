import { z } from "zod";

export const reservationSchema = z.object({
  departmentId: z.string().min(1, "Department is required"),
  campus: z.string().min(1, "Campus is required"),
  eventTitle: z.string().min(3, "Event title is required"),
  eventDescription: z.string().optional().nullable(),
  startDateTime: z.string().min(1, "Start date/time is required"),
  endDateTime: z.string().min(1, "End date/time is required"),
  
  // Venue fields - optional na
  venueIds: z.array(z.string()).optional().default([]),
  venueSpecify: z.record(z.string(), z.string()).optional().default({}),
  customVenueSpecify: z.string().optional().nullable(),
  
  // Equipment fields - optional na
  equipmentIds: z.array(z.object({
    resourceId: z.string(),
    quantity: z.number().int().min(1).default(1),
  })).optional().default([]),
  
  // Service fields - optional
  serviceIds: z.array(z.object({
    resourceId: z.string(),
    notes: z.string().optional(),
  })).optional().default([]),
  
  itemsPersonnelNote: z.string().optional().nullable(),
  conformeName: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  // Validate that at least one venue OR equipment is selected
  const hasVenues = data.venueIds && data.venueIds.length > 0;
  const hasEquipment = data.equipmentIds && data.equipmentIds.length > 0;
  
  if (!hasVenues && !hasEquipment) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select at least one venue or equipment",
      path: ["venueIds"],
    });
  }
  
  // Validate dates
  const start = new Date(data.startDateTime);
  const end = new Date(data.endDateTime);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid date format",
      path: ["startDateTime"],
    });
    return;
  }
  
  if (end <= start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End time must be after start time",
      path: ["endDateTime"],
    });
  }
});

export const gatePassSchema = z.object({
  requestorName: z.string().min(2, "Requestor name is required"),
  course: z.string().optional(),
  studentNumber: z.string().optional(),
  equipmentType: z.string().min(1, "Equipment type is required"),
  equipmentDescription: z.string().optional(),
  brand: z.string().optional(),
  serialNumber: z.string().optional(),
  model: z.string().optional(),
  purpose: z.string().min(5, "Purpose is required"),
  entryDateTime: z.string().min(1, "Entry date/time is required"),
  pullOutDateTime: z.string().min(1, "Pull-out date/time is required"),
  reservationId: z.string().optional(),
  equipment: z.array(z.object({
    resourceId: z.string().optional(),
    customName: z.string().optional(),
    quantity: z.number().int().min(1).default(1),
  })).optional(),
}).superRefine((data, ctx) => {
  const entry = new Date(data.entryDateTime);
  const pullOut = new Date(data.pullOutDateTime);
  
  if (isNaN(entry.getTime()) || isNaN(pullOut.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid date format",
      path: ["entryDateTime"],
    });
    return;
  }
  
  if (pullOut < entry) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Pull-out must be on or after entry",
      path: ["pullOutDateTime"],
    });
  }
});

export const approvalSchema = z.object({
  entityType: z.enum(["reservation", "gate_pass"]),
  entityId: z.string().min(1, "Entity ID is required"),
  action: z.enum(["approve", "reject", "semi_approve", "decline", "cancel"]),
  remarks: z.string().optional(),
  signatureName: z.string().optional(),
}).superRefine((data, ctx) => {
  // Signature name is required for approve/reject/semi_approve/decline actions
  if (["approve", "reject", "semi_approve", "decline"].includes(data.action)) {
    if (!data.signatureName || data.signatureName.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Signature name is required for this action",
        path: ["signatureName"],
      });
    }
  }
  
  // Remarks are required for reject/decline actions
  if (["reject", "decline"].includes(data.action)) {
    if (!data.remarks || data.remarks.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Remarks/reason is required when declining",
        path: ["remarks"],
      });
    }
  }
});

// Export types for use in components
export type ReservationInput = z.infer<typeof reservationSchema>;
export type GatePassInput = z.infer<typeof gatePassSchema>;
export type ApprovalInput = z.infer<typeof approvalSchema>;