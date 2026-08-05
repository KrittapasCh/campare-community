import Link from "next/link";
import type { Metadata } from "next";
import LoginForm from "@/components/auth/login-form";
import OAuthButtons from "@/components/auth/oauth-buttons";
import { getEnabledOAuthProviders } from "@/lib/auth-settings";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/profile";
  const providers = await getEnabledOAuthProviders();

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14">
      <h1 className="text-2xl font-bold">เข้าสู่ระบบ</h1>
      <p className="mt-1 text-sm text-ink-500">
        ยินดีต้อนรับกลับสู่ CamPare Community
      </p>

      {sp.error === "auth_callback_failed" && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          ยืนยันตัวตนไม่สำเร็จ ลองอีกครั้ง
        </p>
      )}

      <div className="mt-6">
        <LoginForm next={next} />
      </div>

      <div className="mt-6">
        <OAuthButtons providers={providers} next={next} />
      </div>

      <p className="mt-6 text-center text-sm text-ink-500">
        เพิ่งเคยเข้ามาใช่หรือไม่?{" "}
        <Link href="/register" className="font-semibold text-brand-600 hover:underline">
          สมัครใหม่
        </Link>
      </p>
    </div>
  );
}
