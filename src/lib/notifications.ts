import { db } from "@/lib/db";

// Helper to send a notification to a user
export async function sendNotification(params: {
  recipientId: string;
  createdById?: string | null;
  title: string;
  body: string;
  type?: "INFO" | "WARNING" | "SUCCESS" | "DEPOSIT" | "WITHDRAWAL" | "TRADE" | "SECURITY";
}) {
  return db.notification.create({
    data: {
      recipientId: params.recipientId,
      createdById: params.createdById ?? null,
      title: params.title,
      body: params.body,
      type: params.type ?? "INFO",
    },
  });
}
