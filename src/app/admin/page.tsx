import Link from "next/link";
import { getAdminStats, requireAdmin } from "@/lib/admin";
import { formatDate, formatPrice } from "@/lib/format";

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();
  const stats = await getAdminStats();

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, order_no, total, status, ordered_at, profiles ( display_name )")
    .order("ordered_at", { ascending: false })
    .limit(5);

  const orders = (recentOrders ?? []) as unknown as {
    id: string;
    order_no: string;
    total: number;
    status: string;
    ordered_at: string;
    profiles: { display_name: string } | null;
  }[];

  const CARDS = [
    { label: "รออนุมัติรูป", value: stats.pendingPhotos, href: "/admin/moderation", accent: stats.pendingPhotos > 0 },
    { label: "รออนุมัติโพสต์", value: stats.pendingPosts, href: "/admin/moderation?tab=posts", accent: stats.pendingPosts > 0 },
    { label: "รายงานที่ยังไม่จัดการ", value: stats.pendingReports, href: "/admin/reports", accent: stats.pendingReports > 0 },
    { label: "สมาชิกทั้งหมด", value: stats.members, href: "/admin/users" },
    { label: "สินค้าในระบบ", value: stats.products, href: "/admin/products" },
    { label: "ประกาศที่ขายอยู่", value: stats.activeListings, href: "/category" },
    { label: "คำสั่งซื้อทั้งหมด", value: stats.orders, href: "/admin" },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold">ภาพรวมระบบ</h1>
      <p className="mt-1 text-sm text-ink-500">
        สรุปสถานะปัจจุบันและสิ่งที่รอให้ผู้ดูแลจัดการ
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={
              "rounded-card border p-4 transition hover:shadow-md " +
              (c.accent
                ? "border-brand-300 bg-brand-50"
                : "border-ink-100 hover:border-brand-200")
            }
          >
            <p className="text-xs text-ink-500">{c.label}</p>
            <p
              className={
                "mt-1 text-3xl font-bold " +
                (c.accent ? "text-brand-600" : "text-ink-800")
              }
            >
              {c.value}
            </p>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-bold">คำสั่งซื้อล่าสุด</h2>
      {orders.length === 0 ? (
        <p className="mt-3 rounded-card border border-dashed border-ink-200 px-4 py-10 text-center text-sm text-ink-500">
          ยังไม่มีคำสั่งซื้อในระบบ
        </p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-card border border-ink-100">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-left text-xs text-ink-500">
              <tr>
                <th className="px-4 py-2 font-medium">เลขที่</th>
                <th className="px-4 py-2 font-medium">ผู้ซื้อ</th>
                <th className="px-4 py-2 font-medium">วันที่</th>
                <th className="px-4 py-2 font-medium">สถานะ</th>
                <th className="px-4 py-2 text-right font-medium">ยอดรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-2.5 font-mono text-xs">{o.order_no}</td>
                  <td className="px-4 py-2.5">{o.profiles?.display_name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-ink-500">
                    {formatDate(o.ordered_at)}
                  </td>
                  <td className="px-4 py-2.5">{o.status}</td>
                  <td className="px-4 py-2.5 text-right font-medium">
                    {formatPrice(o.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
