import { resolveReport } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";

const TARGET_TH: Record<string, string> = {
  product: "สินค้า",
  listing: "ประกาศขาย",
  review: "รีวิว",
  post: "โพสต์",
  comment: "คอมเมนต์",
  photo: "รูปภาพ",
  user: "ผู้ใช้",
};

export default async function ReportsPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("reports")
    .select(
      "id, target_type, target_id, reason, detail, status, created_at, handled_at, profiles!reports_reporter_id_fkey ( display_name )"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const reports = (data ?? []) as unknown as {
    id: string;
    target_type: string;
    target_id: string;
    reason: string;
    detail: string | null;
    status: string;
    created_at: string;
    handled_at: string | null;
    profiles: { display_name: string } | null;
  }[];

  const pending = reports.filter((r) => r.status === "pending");
  const handled = reports.filter((r) => r.status !== "pending");

  return (
    <>
      <h1 className="text-2xl font-bold">รายงานปัญหา</h1>
      <p className="mt-1 text-sm text-ink-500">
        คำร้องเรียนจากผู้ใช้ — ตาราง <code className="rounded bg-ink-100 px-1 font-mono text-xs">reports</code>{" "}
        ใช้ <code className="rounded bg-ink-100 px-1 font-mono text-xs">target_type</code> +{" "}
        <code className="rounded bg-ink-100 px-1 font-mono text-xs">target_id</code>{" "}
        ชี้ไปได้ทุกชนิดเนื้อหาโดยไม่ต้องแยกตาราง
      </p>

      <h2 className="mt-6 text-lg font-bold">
        รอจัดการ{" "}
        <span className="text-sm font-normal text-ink-500">
          ({pending.length})
        </span>
      </h2>

      {pending.length === 0 ? (
        <p className="mt-3 rounded-card border border-dashed border-ink-200 px-4 py-12 text-center text-sm text-ink-500">
          ไม่มีรายงานที่รอจัดการ
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {pending.map((r) => (
            <li key={r.id} className="rounded-card border border-ink-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    <span className="mr-2 rounded bg-ink-100 px-2 py-0.5 text-[11px]">
                      {TARGET_TH[r.target_type] ?? r.target_type}
                    </span>
                    {r.reason}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    แจ้งโดย {r.profiles?.display_name ?? "ผู้ใช้"} ·{" "}
                    {formatDate(r.created_at)}
                  </p>
                </div>
              </div>

              {r.detail && (
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  {r.detail}
                </p>
              )}

              <p className="mt-2 font-mono text-[11px] text-ink-400">
                target_id: {r.target_id}
              </p>

              <div className="mt-3 flex gap-2">
                <form action={resolveReport}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="decision" value="approved" />
                  <button
                    type="submit"
                    className="rounded-lg bg-brand-400 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500"
                  >
                    รับเรื่องและจัดการแล้ว
                  </button>
                </form>
                <form action={resolveReport}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="decision" value="rejected" />
                  <button
                    type="submit"
                    className="rounded-lg border border-ink-200 px-4 py-2 text-xs font-semibold text-ink-600 hover:border-ink-300"
                  >
                    ไม่พบปัญหา
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {handled.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-bold">จัดการแล้ว</h2>
          <ul className="mt-3 divide-y divide-ink-100 rounded-card border border-ink-100">
            {handled.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
              >
                <span className="rounded bg-ink-100 px-2 py-0.5 text-[11px]">
                  {TARGET_TH[r.target_type] ?? r.target_type}
                </span>
                <span className="min-w-0 flex-1 truncate">{r.reason}</span>
                <span
                  className={
                    "rounded-full px-2.5 py-0.5 text-[11px] " +
                    (r.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : "bg-ink-100 text-ink-600")
                  }
                >
                  {r.status === "approved" ? "จัดการแล้ว" : "ไม่พบปัญหา"}
                </span>
                <span className="text-xs text-ink-400">
                  {formatDate(r.handled_at)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
