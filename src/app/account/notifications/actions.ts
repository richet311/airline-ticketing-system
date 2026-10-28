"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { inboxLink, markAllRead, markRead } from "@/lib/inbox";
import { getCurrentUser } from "@/lib/session";

export async function openMessage(formData: FormData): Promise<void> {
  const notificationId = Number(formData.get("notification_id"));
  const unreadOnly = formData.get("show") === "unread";
  const user = await getCurrentUser();
  if (!user || !Number.isInteger(notificationId)) redirect("/account/notifications");

  await markRead(user.user_id, notificationId);
  redirect(inboxLink({ id: notificationId, unreadOnly }));
}

export async function markAllAsRead(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  await markAllRead(user.user_id);
  refresh();
}
