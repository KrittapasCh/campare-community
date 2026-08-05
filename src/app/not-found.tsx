import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-5xl font-bold text-brand-400">404</p>
      <h1 className="mt-3 text-xl font-bold">ไม่พบหน้าที่คุณกำลังหา</h1>
      <p className="mt-2 text-sm text-ink-500">
        ลิงก์อาจถูกย้าย หรือสินค้าถูกลบออกจากระบบแล้ว
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-brand-400 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
      >
        กลับหน้าแรก
      </Link>
    </div>
  );
}
