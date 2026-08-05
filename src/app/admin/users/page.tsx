import { setUserActive, setUserRole } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";

export default async function AdminUsersPage() {
  const { supabase, user: me } = await requireAdmin();

  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, email, phone, role, is_deleted, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const users = (data ?? []) as {
    id: string;
    username: string;
    display_name: string;
    email: string | null;
    phone: string | null;
    role: string;
    is_deleted: boolean;
    created_at: string;
  }[];

  return (
    <>
      <h1 className="text-2xl font-bold">จัดการสมาชิก</h1>
      <p className="mt-1 text-sm text-ink-500">
        เปลี่ยนสิทธิ์และระงับบัญชีได้ — ระบบใช้ soft delete (
        <code className="rounded bg-ink-100 px-1 font-mono text-xs">is_deleted</code>
        ) ไม่ลบข้อมูลจริง เพื่อไม่ให้ประกาศและรีวิวที่อ้างถึงผู้ใช้พัง
      </p>

      <div className="mt-6 overflow-x-auto rounded-card border border-ink-100">
        <table className="w-full min-w-3xl text-sm">
          <thead className="bg-ink-50 text-left text-xs text-ink-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">สมาชิก</th>
              <th className="px-4 py-2.5 font-medium">ติดต่อ</th>
              <th className="px-4 py-2.5 font-medium">สมัครเมื่อ</th>
              <th className="px-4 py-2.5 font-medium">สิทธิ์</th>
              <th className="px-4 py-2.5 text-right font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {users.map((u) => {
              const isMe = u.id === me.id;
              return (
                <tr key={u.id} className={u.is_deleted ? "opacity-50" : ""}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                        {u.display_name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium">
                          {u.display_name}
                          {isMe && (
                            <span className="ml-1.5 text-[11px] text-ink-400">
                              (คุณ)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-ink-400">@{u.username}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-xs text-ink-500">
                    <p>{u.email ?? "—"}</p>
                    <p>{u.phone ?? "—"}</p>
                  </td>

                  <td className="px-4 py-3 text-xs text-ink-500">
                    {formatDate(u.created_at)}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={
                        "rounded-full px-2.5 py-0.5 text-[11px] font-medium " +
                        (u.role === "admin"
                          ? "bg-ink-800 text-white"
                          : "bg-ink-100 text-ink-600")
                      }
                    >
                      {u.role === "admin" ? "ผู้ดูแล" : "สมาชิก"}
                    </span>
                    {u.is_deleted && (
                      <span className="ml-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] text-red-700">
                        ระงับอยู่
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {!isMe && (
                        <>
                          <form action={setUserRole}>
                            <input type="hidden" name="id" value={u.id} />
                            <input
                              type="hidden"
                              name="role"
                              value={u.role === "admin" ? "user" : "admin"}
                            />
                            <button
                              type="submit"
                              className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium hover:border-brand-300 hover:text-brand-600"
                            >
                              {u.role === "admin" ? "ถอดสิทธิ์ผู้ดูแล" : "ตั้งเป็นผู้ดูแล"}
                            </button>
                          </form>

                          <form action={setUserActive}>
                            <input type="hidden" name="id" value={u.id} />
                            <input
                              type="hidden"
                              name="deleted"
                              value={String(!u.is_deleted)}
                            />
                            <button
                              type="submit"
                              className={
                                "rounded-lg border px-3 py-1.5 text-xs font-medium " +
                                (u.is_deleted
                                  ? "border-green-300 text-green-700 hover:bg-green-50"
                                  : "border-ink-200 text-ink-600 hover:border-red-300 hover:text-red-600")
                              }
                            >
                              {u.is_deleted ? "คืนสถานะ" : "ระงับบัญชี"}
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-ink-400">
        หมายเหตุ: ระบบไม่ให้คุณถอดสิทธิ์หรือระงับบัญชีตัวเอง
        เพื่อกันไม่ให้ระบบเหลือศูนย์ผู้ดูแล
      </p>
    </>
  );
}
