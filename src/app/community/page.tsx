import Link from "next/link";
import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "คอมมูนิตี้" };

type SearchParams = Promise<{
  filter?: string;
  tag?: string;
  submitted?: string;
}>;

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">คอมมูนิตี้</h1>
        <p className="mt-3 text-ink-500">หน้านี้ต้องเชื่อม Supabase ก่อน</p>
      </div>
    );
  }

  const supabase = await createClient();
  const session = await getCurrentUser();

  let query = supabase
    .from("community_posts")
    .select(
      "id, title, body, tags, is_question, created_at, profiles ( display_name ), products ( name, slug )"
    )
    .eq("status", "approved")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(50);

  if (sp.filter === "question") query = query.eq("is_question", true);
  if (sp.filter === "share") query = query.eq("is_question", false);
  if (sp.tag) query = query.contains("tags", [sp.tag]);

  const { data } = await query;

  const posts = (data ?? []) as unknown as {
    id: string;
    title: string;
    body: string;
    tags: string[] | null;
    is_question: boolean;
    created_at: string;
    profiles: { display_name: string } | null;
    products: { name: string; slug: string } | null;
  }[];

  // นับจำนวนคอมเมนต์ของแต่ละกระทู้
  const ids = posts.map((p) => p.id);
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: cs } = await supabase
      .from("comments")
      .select("target_id")
      .eq("target_type", "post")
      .eq("is_deleted", false)
      .in("target_id", ids);

    for (const c of (cs ?? []) as { target_id: string }[]) {
      counts.set(c.target_id, (counts.get(c.target_id) ?? 0) + 1);
    }
  }

  const popularTags = Array.from(
    new Set(posts.flatMap((p) => p.tags ?? []))
  ).slice(0, 12);

  const FILTERS = [
    ["", "ทั้งหมด"],
    ["question", "คำถาม"],
    ["share", "แชร์ประสบการณ์"],
  ] as const;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">คอมมูนิตี้</h1>
          <p className="mt-1 text-sm text-ink-500">
            ถามคำถามเรื่องกล้อง แชร์ประสบการณ์ใช้งานจริง
          </p>
        </div>
        <Link
          href={session ? "/community/new" : "/login?next=/community/new"}
          className="rounded-lg bg-brand-400 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
        >
          + ตั้งกระทู้
        </Link>
      </div>

      {sp.submitted && (
        <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          ส่งกระทู้เรียบร้อย — รอผู้ดูแลอนุมัติก่อนจะแสดงในคอมมูนิตี้
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map(([value, label]) => {
          const active = (sp.filter ?? "") === value;
          return (
            <Link
              key={value || "all"}
              href={value ? `/community?filter=${value}` : "/community"}
              className={
                "rounded-full border px-4 py-1.5 text-sm " +
                (active
                  ? "border-brand-400 bg-brand-50 text-brand-700"
                  : "border-ink-200 hover:border-brand-300")
              }
            >
              {label}
            </Link>
          );
        })}
      </div>

      {popularTags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-ink-400">แท็ก</span>
          {popularTags.map((t) => (
            <Link
              key={t}
              href={`/community?tag=${encodeURIComponent(t)}`}
              className={
                "rounded-full px-2.5 py-1 " +
                (sp.tag === t
                  ? "bg-brand-400 text-white"
                  : "bg-ink-100 text-ink-600 hover:bg-ink-200")
              }
            >
              #{t}
            </Link>
          ))}
          {sp.tag && (
            <Link href="/community" className="text-ink-500 hover:text-brand-600">
              ล้างแท็ก
            </Link>
          )}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-ink-200 py-20 text-center">
          <p className="text-4xl">💬</p>
          <p className="mt-3 font-medium">ยังไม่มีกระทู้</p>
          <p className="mt-1 text-sm text-ink-500">
            ตั้งกระทู้แรกได้เลย — ผู้ดูแลจะอนุมัติแล้วขึ้นแสดงที่นี่
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/community/${p.id}`}
                className="block rounded-card border border-ink-100 p-4 transition hover:border-brand-300 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      "rounded px-2 py-0.5 text-[11px] font-medium " +
                      (p.is_question
                        ? "bg-brand-100 text-brand-700"
                        : "bg-ink-100 text-ink-600")
                    }
                  >
                    {p.is_question ? "คำถาม" : "ประสบการณ์"}
                  </span>
                  {p.products && (
                    <span className="text-xs text-ink-500">
                      เกี่ยวกับ {p.products.name}
                    </span>
                  )}
                </div>

                <h2 className="mt-2 font-semibold">{p.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-600">
                  {p.body}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-400">
                  <span>{p.profiles?.display_name ?? "ผู้ใช้"}</span>
                  <span>{formatDate(p.created_at)}</span>
                  <span>💬 {counts.get(p.id) ?? 0}</span>
                  {!!p.tags?.length && (
                    <span className="flex flex-wrap gap-1">
                      {p.tags.map((t) => (
                        <span key={t} className="text-ink-500">
                          #{t}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
