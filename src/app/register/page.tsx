import Link from "next/link";
import type { Metadata } from "next";
import RegisterForm from "@/components/auth/register-form";
import OAuthButtons from "@/components/auth/oauth-buttons";
import { getEnabledOAuthProviders } from "@/lib/auth-settings";

export const metadata: Metadata = { title: "สมัครสมาชิก" };

export default async function RegisterPage() {
  const providers = await getEnabledOAuthProviders();

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14">
      <h1 className="text-2xl font-bold">สมัครสมาชิก</h1>
      <p className="mt-1 text-sm text-ink-500">
        สมัครฟรี เพื่อบันทึกรายการโปรด รีวิว และซื้อขายในคอมมูนิตี้
      </p>

      <div className="mt-6">
        <RegisterForm />
      </div>

      <div className="mt-6">
        <OAuthButtons providers={providers} />
      </div>

      <p className="mt-6 text-center text-sm text-ink-500">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
