import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import PostCommentForm from "@/components/community/post-comment-form";
import { markAsAnswer } from "@/app/community/actions";
import { getCurrentUser } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "กระทู้" };

type Params = Promise<{ id: string }>;

export default async function PostDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  if (!isSupabaseConfigured) notFound();

  const supabase = await createClient();

  const [postRes, commentsRes, session] = await Promise.all([
    supabase
      .from("community_posts")
      .select(
        "id, author_id, title, body, tags, is_question, status, created_at, profiles ( display_name ), products ( name, slug )"
      )
      .eq("id", id)
      .eq("is_deleted", false)
      .maybeSingle(),
    supabase
      .from("comments")
      .select("id, author_id, body, is_answer, created_at, profiles ( display_name )")
      .eq("target_type", "post")
      .eq("target_id", id)
      .eq("is_deleted", false)
      .order("is_answer", { ascending: false })
      .order("created_at", { ascending: true }),
    getCurrentUser(),
  ]);

  if (!postRes.data) notFound();

  const post = postRes.data as unknown as {
    id: string;
    author_id: string;
    title: string;
    body: string;
    tags: string[] | null;
    is_question: boolean;
    status: string;
    created_at: string;
    profiles: { display_name: string } | null;
    products: { name: string; slug: string } | null;
  };

  const comments = (commentsRes.data ?? []) as unknown as {
    id: string;
    author_id: string;
    body: string;
    is_answer: boolean;
    created_at: string;
    profiles: { display_name: string } | null;
  }[];

  const isAuthor = session?.user.id === post.author_id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/community" className="text-sm text-ink-500 hover:text-brand-600">
        ← กลับไปคอมมูนิตี้
      </Link>

      {post.status !== "approved" && (
        <p className="mt-3 rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-800">
          กระทู้นี้ยังรอผู้ดูแลอนุมัติ — คนอื่นยังมองไม่เห็น
        </p>
      )}

      <article className="mt-4 rounded-card border border-ink-100 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              "rounded px-2 py-0.5 text-[11px] font-medium " +
              (post.is_question
                ? "bg-brand-100 text-brand-700"
                : "bg-ink-100 text-ink-600")
            }
          >
            {post.is_question ? "คำถาม" : "ประสบการณ์"}
          </span>
          {post.products && (
            <Link
              href={`/product/${post.products.slug}`}
              className="text-xs text-brand-600 hover:underline"
            >
              เกี่ยวกับ {post.products.name}
            </Link>
          )}
        </div>

        <h1 className="mt-3 text-2xl font-bold">{post.title}</h1>
        <p className="mt-1 text-sm text-ink-500">
          โดย {post.profiles?.display_name ?? "ผู้ใช้"} ·{" "}
          {formatDate(post.created_at)}
        </p>

        <p className="mt-5 whitespace-pre-line leading-relaxed text-ink-700">
          {post.body}
        </p>

        {!!post.tags?.length && (
          <div className="mt-5 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <Link
                key={t}
                href={`/community?tag=${encodeURIComponent(t)}`}
                className="rounded-full bg-ink-100 px-3 py-1 text-xs text-ink-600 hover:bg-ink-200"
              >
                #{t}
              </Link>
            ))}
          </div>
        )}
      </article>

      <section className="mt-8">
        <h2 className="text-lg font-bold">
          {post.is_question ? "คำตอบ" : "ความคิดเห็น"}{" "}
          <span className="text-sm font-normal text-ink-500">
            ({comments.length})
          </span>
        </h2>

        {comments.length > 0 && (
          <ul className="mt-4 space-y-3">
            {comments.map((c) => (
              <li
                key={c.id}
                className={
                  "rounded-card border p-4 " +
                  (c.is_answer
                    ? "border-green-300 bg-green-50"
                    : "border-ink-100")
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {c.profiles?.display_name ?? "ผู้ใช้"}
                    {c.author_id === post.author_id && (
                      <span className="ml-2 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-normal text-ink-500">
                        เจ้าของกระทู้
                      </span>
                    )}
                    {c.is_answer && (
                      <span className="ml-2 rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-normal text-white">
                        ✓ คำตอบที่เลือก
                      </span>
                    )}
                  </p>
                  <span className="text-xs text-ink-400">
                    {formatDate(c.created_at)}
                  </span>
                </div>

                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">
                  {c.body}
                </p>

                {isAuthor && post.is_question && (
                  <form action={markAsAnswer} className="mt-3">
                    <input type="hidden" name="comment_id" value={c.id} />
                    <input type="hidden" name="post_id" value={post.id} />
                    <input
                      type="hidden"
                      name="is_answer"
                      value={String(c.is_answer)}
                    />
                    <button
                      type="submit"
                      className={
                        "rounded-lg border px-3 py-1.5 text-xs font-medium " +
                        (c.is_answer
                          ? "border-ink-200 text-ink-600 hover:border-ink-300"
                          : "border-green-300 text-green-700 hover:bg-green-50")
                      }
                    >
                      {c.is_answer ? "ยกเลิกคำตอบที่เลือก" : "เลือกเป็นคำตอบ"}
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5">
          <PostCommentForm
            postId={post.id}
            signedIn={!!session}
            isQuestion={post.is_question}
          />
        </div>
      </section>
    </div>
  );
}
