import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/queries";
import { getCartCount } from "@/lib/cart";
import SearchBar from "@/components/search-bar";

/** useSearchParams ต้องอยู่ใต้ Suspense ไม่งั้น build จะ error */
function Search() {
  return (
    <Suspense
      fallback={<div className="h-9 w-full rounded-full bg-ink-100" />}
    >
      <SearchBar />
    </Suspense>
  );
}

export default async function SiteHeader() {
  const session = await getCurrentUser();
  const profile = session?.profile as { display_name?: string; role?: string } | null;
  const cartCount = session ? await getCartCount() : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight">
          Cam<span className="text-brand-400">Pare</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-ink-600 md:flex">
          <Link className="rounded-lg px-3 py-2 hover:bg-ink-50" href="/">
            หน้าแรก
          </Link>
          <Link className="rounded-lg px-3 py-2 hover:bg-ink-50" href="/category">
            สินค้า
          </Link>
          <Link className="rounded-lg px-3 py-2 hover:bg-ink-50" href="/compare">
            เปรียบเทียบ
          </Link>
          <Link className="rounded-lg px-3 py-2 hover:bg-ink-50" href="/sell">
            ลงขาย
          </Link>
          <Link className="rounded-lg px-3 py-2 hover:bg-ink-50" href="/about">
            เกี่ยวกับเรา
          </Link>
        </nav>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2">
          <div className="hidden w-full max-w-xs lg:block">
            <Search />
          </div>

          {session ? (
            <div className="flex items-center gap-2">
              <Link
                href="/cart"
                aria-label={`ตะกร้าสินค้า ${cartCount} ชิ้น`}
                className="relative grid size-9 place-items-center rounded-full text-ink-600 hover:bg-ink-50 hover:text-brand-600"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9.5" cy="20" r="1.3" />
                  <circle cx="17" cy="20" r="1.3" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid min-w-4.5 place-items-center rounded-full bg-brand-400 px-1 text-[10px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>

              {profile?.role === "admin" && (
                <Link
                  href="/admin"
                  className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 sm:block"
                >
                  ผู้ดูแล
                </Link>
              )}
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full border border-ink-200 py-1 pl-1 pr-3 text-sm hover:border-brand-300"
              >
                <span className="grid size-7 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {(profile?.display_name ?? "U").charAt(0).toUpperCase()}
                </span>
                <span className="max-w-24 truncate">
                  {profile?.display_name ?? "โปรไฟล์"}
                </span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand-400 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-500"
              >
                สมัครสมาชิก
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-ink-100 px-4 py-2 lg:hidden">
        <Search />
      </div>
    </header>
  );
}
