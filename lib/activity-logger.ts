import { prisma } from "@/lib/prisma";

export type LogAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "BULK_DELETE"
  | "BULK_UPDATE"
  | "APPROVE"
  | "UNAPPROVE"
  | "EXPORT"
  | "LOGIN"
  | "LOGOUT"
  | "SETTINGS_UPDATE";

export type LogEntityType =
  | "Order"
  | "Service"
  | "Portfolio"
  | "Testimonial"
  | "SiteSetting"
  | "Auth";

/**
 * Writes an audit log entry. Non-blocking — errors are swallowed to never
 * break the main request flow.
 */
export async function logActivity({
  action,
  entityType,
  entityId,
  description,
}: {
  action: LogAction;
  entityType: LogEntityType;
  entityId?: string;
  description: string;
}): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        entityType,
        entityId: entityId ?? null,
        description,
      },
    });
  } catch (err) {
    console.warn("[activity-logger] Failed to write log:", err);
  }
}

