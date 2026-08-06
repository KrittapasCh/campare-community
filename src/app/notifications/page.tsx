import { redirect } from "next/navigation";
import type { Metadata } from "next";

import {
  clearReadNotifications,
  deleteNotification,
  markAllRead,
  openNotification,
} from "@/app/notifications/actions";
import { getCurrentUser } from "@/lib/queries";
import {
  getNotifications,
  NOTIFICATION_ICON,
  NOTIFICATION_LABEL,
} from "@/lib/notifications";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "การแจ้งเตือน" };

export default async function NotificationsPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">การแจ้งเตือน</h1>
        <p className="mt-3 text-ink-500">หน้านี้ต้องเชื่อม Supabase ก่อน</p>
      </div>
    );
  }

  const session = await getCurrentUser();
  if (!session) redirect("/login?next=/notifications");

  const items = await getNotifications();
  const unread = items.filter((n) => !n.is_read).length;
  const read = items.length - unread;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">การแจ้งเตือน</h1>
          <p className="mt-1 text-sm text-ink-500">
            {unread > 0 ? `ยังไม่ได้อ่าน ${unread} รายการ` : "อ่านครบแล้ว"}
          </p>
        </div>

        <div className="flex gap-2">
          {unread > 0 && (
            <form action={markAllRead}>
              <button
                type="submit"
                className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium hover:border-brand-300 hover:text-brand-600"
              >
                อ่านทั้งหมด
              </button>
            </form>
          )}
          {read > 0 && (
            <form action={clearReadNotifications}>
              <button
                type="submit"
                className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:border-red-300 hover:text-red-600"
              >
                ล้างที่อ่านแล้ว
              </button>
            </form>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-ink-200 py-20 text-center">
          <p className="text-4xl">🔔</p>
          <p className="mt-3 font-medium">ยังไม่มีการแจ้งเตือน</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">
            กดหัวใจสินค้าที่สนใจไว้ พอมีคนลงประกาศขายหรือรีวิวรุ่นนั้น
            <br />
            ระบบจะแจ้งให้ทันที
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={
                "flex items-start gap-3 rounded-card border p-4 transition " +
                (n.is_read
                  ? "border-ink-100 bg-white"
                  : "border-brand-200 bg-brand-50")
              }
            >
              <span className="text-xl leading-none">
                {NOTIFICATION_ICON[n.type] ?? "🔔"}
              </span>

              <div className="min-w-0 flex-1">
                <form action={openNotification}>
                  <input type="hidden" name="id" value={n.id} />
                  <input type="hidden" name="link" value={n.link ?? ""} />
                  <button
                    type="submit"
                    className="block w-full text-left"
                    disabled={!n.link}
                  >
                    <span className="block text-[11px] uppercase tracking-wide text-ink-400">
                      {NOTIFICATION_LABEL[n.type] ?? n.type}
                    </span>
                    <span
                      className={
                        "mt-0.5 block text-sm " +
                        (n.is_read ? "font-medium" : "font-semibold")
                      }
                    >
                      {n.title}
                    </span>
                    {n.body && (
                      <span className="mt-0.5 block text-sm leading-relaxed text-ink-600">
                        {n.body}
                      </span>
                    )}
                    <span className="mt-1 block text-xs text-ink-400">
                      {formatDate(n.created_at)}
                      {n.link && " · กดเพื่อดู"}
                    </span>
                  </button>
                </form>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                {!n.is_read && (
                  <span className="mt-1 size-2 rounded-full bg-brand-400" />
                )}
                <form action={deleteNotification}>
                  <input type="hidden" name="id" value={n.id} />
                  <button
                    type="submit"
                    aria-label="ลบการแจ้งเตือน"
                    className="text-xs text-ink-300 hover:text-red-500"
                  >
                    ✕
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
