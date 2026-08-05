import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin, getAdminStats } from "@/lib/admin";

export const metadata: Metadata = { title: "ผู้ดูแลระบบ" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAdmin();
  const stats = await getAdminStats();
  const pending = stats.pendingPhotos + stats.pendingPosts;

  const NAV: { href: string; label: string; badge?: number }[] = [
    { href: "/admin", label: "ภาพรวม" },
    { href: "/admin/moderation", label: "ตรวจสอบเนื้อหา", badge: pending },
    { href: "/admin/reports", label: "รายงานปัญหา", badge: stats.pendingReports },
    { href: "/admin/products", label: "จัดการสินค้า" },
    { href: "/admin/users", label: "จัดการสมาชิก" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-card border border-ink-100 p-4">
            <p className="text-xs uppercase tracking-wide text-ink-400">
              ผู้ดูแลระบบ
            </p>
            <p className="mt-1 font-semibold">{profile.display_name}</p>
          </div>

          <nav className="mt-4 space-y-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium text-ink-600 transition hover:bg-ink-50"
              >
                {n.label}
                {!!n.badge && n.badge > 0 && (
                  <span className="grid min-w-5 place-items-center rounded-full bg-brand-400 px-1.5 text-[11px] font-bold text-white">
                    {n.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <Link
            href="/"
            className="mt-4 block rounded-lg border border-ink-200 py-2.5 text-center text-sm font-medium text-ink-600 hover:border-brand-300 hover:text-brand-600"
          >
            ← กลับหน้าเว็บ
          </Link>
        </aside>

        <section>{children}</section>
      </div>
    </div>
  );
}
