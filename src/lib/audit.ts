import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function logAudit(params: {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: (params.metadata as Prisma.InputJsonValue) ?? undefined,
        ipAddress: params.ipAddress,
      },
    });
  } catch {
    // Non-blocking audit logging
  }
}
