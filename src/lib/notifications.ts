import { prisma } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({ data: params });
}

export async function notifyUserIds(
  userIds: string[],
  params: Omit<Parameters<typeof createNotification>[0], "userId">
) {
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, ...params })),
  });
}
