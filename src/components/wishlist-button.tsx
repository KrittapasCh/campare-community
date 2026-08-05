"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * ปุ่มหัวใจ — เก็บลง Supabase ถ้าล็อกอินแล้ว
 * ถ้ายังไม่ล็อกอิน จะพาไปหน้า /login
 */
export default function WishlistButton({
  productId,
  size = "sm",
}: {
  productId: string;
  size?: "sm" | "lg";
}) {
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { data } = await supabase
          .from("wishlist_items")
          .select("id, wishlists!inner(user_id)")
          .eq("product_id", productId)
          .eq("wishlists.user_id", user.id)
          .maybeSingle();

        if (!cancelled) setActive(!!data);
      } catch {
        /* เงียบไว้ — ปุ่มยังกดได้ */
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  function toggle() {
    startTransition(async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setActive((v) => !v);
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = `/login?next=${encodeURIComponent(location.pathname)}`;
        return;
      }

      // หา wishlist หลักของผู้ใช้ ถ้ายังไม่มีก็สร้าง
      let { data: wl } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle();

      if (!wl) {
        const { data: created } = await supabase
          .from("wishlists")
          .insert({ user_id: user.id })
          .select("id")
          .single();
        wl = created;
      }
      if (!wl) return;

      if (active) {
        await supabase
          .from("wishlist_items")
          .delete()
          .eq("wishlist_id", wl.id)
          .eq("product_id", productId);
        setActive(false);
      } else {
        await supabase
          .from("wishlist_items")
          .insert({ wishlist_id: wl.id, product_id: productId });
        setActive(true);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending || !ready}
      aria-pressed={active}
      aria-label={active ? "เอาออกจากรายการโปรด" : "เพิ่มลงรายการโปรด"}
      className={[
        "grid place-items-center rounded-full border bg-white/90 backdrop-blur transition",
        size === "lg" ? "size-11" : "size-8",
        active
          ? "border-brand-300 text-brand-500"
          : "border-ink-200 text-ink-400 hover:text-brand-500",
        pending ? "opacity-60" : "",
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        className={size === "lg" ? "size-5" : "size-4"}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6c0 5.8-8.5 11.3-8.5 11.3Z" />
      </svg>
    </button>
  );
}
