/**
 * แสดงระหว่างรอหน้าถัดไปโหลด
 *
 * Next.js จะสลับมาหน้านี้ทันทีที่กดลิงก์ ทำให้รู้สึกว่าเว็บตอบสนองเร็ว
 * แทนที่จะค้างอยู่หน้าเดิมเงียบ ๆ จนกว่าข้อมูลจะมาครบ
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-ink-100" />
      <div className="mt-3 h-4 w-80 animate-pulse rounded bg-ink-100" />

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-card border border-ink-100"
          >
            <div className="aspect-4/3 animate-pulse bg-ink-100" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-16 animate-pulse rounded bg-ink-100" />
              <div className="h-4 w-full animate-pulse rounded bg-ink-100" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-ink-100" />
              <div className="h-5 w-24 animate-pulse rounded bg-ink-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
