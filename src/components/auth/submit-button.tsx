"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children,
  pendingText = "กำลังดำเนินการ…",
}: {
  children: React.ReactNode;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand-400 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-60"
    >
      {pending ? pendingText : children}
    </button>
  );
}
