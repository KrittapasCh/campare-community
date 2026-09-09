import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "สั่งซื้อสำเร็จ" };

type SearchParams = Promise<{ order?: string }>;

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-green-100">
        <svg
          viewBox="0 0 24 24"
          className="size-8 text-green-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h1 className="mt-5 text-2xl font-bold">สั่งซื้อสำเร็จ</h1>
      <p className="mt-2 text-sm text-ink-500">
        ขอบคุณที่ใช้บริการ Shopcam
      </p>

      {sp.order && (
        <p className="mt-4 inline-block rounded-lg bg-ink-50 px-4 py-2 font-mono text-sm">
          เลขที่คำสั่งซื้อ <span className="font-bold">{sp.order}</span>
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-ink-400">
        นี่เป็นการจำลองคำสั่งซื้อเพื่อการศึกษา ไม่มีการตัดเงินและไม่มีการจัดส่งจริง
        <br />
        ผู้ขายจะติดต่อกลับผ่านช่องทางที่ระบุไว้ในประกาศ
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/profile?tab=purchase"
          className="rounded-lg bg-brand-400 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-500"
        >
          ดูประวัติการซื้อ
        </Link>
        <Link
          href="/category"
          className="rounded-lg border border-ink-200 px-6 py-3 text-sm font-semibold hover:border-brand-300 hover:text-brand-600"
        >
          เลือกซื้อต่อ
        </Link>
      </div>
    </div>
  );
}
