import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-ink-100 bg-ink-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold">
            Cam<span className="text-brand-400">Pare</span> Community
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            เปรียบเทียบสเปกกล้องแบบ side-by-side ซื้อขายมือสอง
            และแลกเปลี่ยนประสบการณ์กับคนถ่ายภาพด้วยกัน
          </p>
        </div>

        <div className="text-sm">
          <p className="font-semibold">เมนู</p>
          <ul className="mt-3 space-y-2 text-ink-500">
            <li><Link className="hover:text-brand-500" href="/category">สินค้าทั้งหมด</Link></li>
            <li><Link className="hover:text-brand-500" href="/compare">เปรียบเทียบ</Link></li>
            <li><Link className="hover:text-brand-500" href="/gallery">แกลเลอรีภาพตัวอย่าง</Link></li>
            <li><Link className="hover:text-brand-500" href="/community">คอมมูนิตี้</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <p className="font-semibold">บัญชี</p>
          <ul className="mt-3 space-y-2 text-ink-500">
            <li><Link className="hover:text-brand-500" href="/login">เข้าสู่ระบบ</Link></li>
            <li><Link className="hover:text-brand-500" href="/register">สมัครสมาชิก</Link></li>
            <li><Link className="hover:text-brand-500" href="/profile">โปรไฟล์ของฉัน</Link></li>
            <li><Link className="hover:text-brand-500" href="/profile?tab=favourite">รายการโปรด</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <p className="font-semibold">เกี่ยวกับโปรเจกต์</p>
          <p className="mt-3 leading-relaxed text-ink-500">
            โปรเจกต์รายวิชา System Analysis and Design
            <br />
            ราคาและข้อมูลสเปกเป็นข้อมูลตัวอย่างเพื่อการศึกษา
          </p>
        </div>
      </div>

      <div className="border-t border-ink-200 py-4 text-center text-xs text-ink-400">
        © {new Date().getFullYear()} CamPare Community
      </div>
    </footer>
  );
}
