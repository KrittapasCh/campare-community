import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type NotificationType =
  | "wishlist_available"
  | "new_review"
  | "question_answered"
  | "order_update"
  | "moderation";

export type NotificationRow = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export const NOTIFICATION_ICON: Record<NotificationType, string> = {
  wishlist_available: "🔔",
  new_review: "⭐",
  question_answered: "💬",
  order_update: "📦",
  moderation: "🛡️",
};

export const NOTIFICATION_LABEL: Record<NotificationType, string> = {
  wishlist_available: "ของเข้าตรงรายการโปรด",
  new_review: "รีวิวใหม่",
  question_answered: "มีคนตอบ",
  order_update: "คำสั่งซื้อ",
  moderation: "การตรวจสอบเนื้อหา",
};

export async function getNotifications(limit = 50): Promise<NotificationRow[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, link, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as NotificationRow[];
  } catch {
    return [];
  }
}

export async function getUnreadCount(): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    return count ?? 0;
  } catch {
    return 0;
  }
}
