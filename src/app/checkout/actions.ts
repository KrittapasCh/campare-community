"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cartTotals, getCartItems } from "@/lib/cart";

export type CheckoutState = { error?: string };

const PAYMENT_METHODS = [
  "mobile_banking",
  "cash",
  "credit_debit_card",
  "coin",
] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const SHIPPING_FEE = 0; // ส่งฟรีตาม wireframe

/** เลขที่คำสั่งซื้อ เช่น SC-260910-4F2A (บิลเก่าที่ออกก่อนเปลี่ยนชื่อยังขึ้นต้น CP-) */
function makeOrderNo() {
  const d = new Date();
  const ymd =
    String(d.getFullYear()).slice(2) +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SC-${ymd}-${rand}`;
}

export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  if (!isSupabaseConfigured) return { error: "ยังไม่ได้ตั้งค่า Supabase" };

  const method = String(formData.get("payment_method") ?? "") as PaymentMethod;
  const address = String(formData.get("address") ?? "").trim();

  if (!PAYMENT_METHODS.includes(method))
    return { error: "เลือกวิธีชำระเงินก่อน" };
  if (address.length < 10)
    return { error: "กรอกที่อยู่จัดส่งให้ครบถ้วน (อย่างน้อย 10 ตัวอักษร)" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/checkout");

  const items = await getCartItems();
  const { selected, subtotal } = cartTotals(items);

  if (selected.length === 0)
    return { error: "ยังไม่ได้เลือกสินค้าในตะกร้า" };

  // เช็คอีกรอบว่าประกาศยังขายอยู่ (กันกรณีคนอื่นซื้อตัดหน้า)
  const closed = selected.filter((i) => i.listing?.status !== "active");
  if (closed.length > 0)
    return {
      error: `มี ${closed.length} รายการที่ปิดการขายไปแล้ว กลับไปเอาออกจากตะกร้าก่อน`,
    };

  // 1) หัวบิล
  const orderNo = makeOrderNo();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_no: orderNo,
      buyer_id: user.id,
      status: "paid", // mock — ไม่มีระบบชำระเงินจริง
      payment_method: method,
      shipping_address: address,
      subtotal,
      shipping_fee: SHIPPING_FEE,
      total: subtotal + SHIPPING_FEE,
    })
    .select("id, order_no")
    .single();

  if (orderError || !order)
    return { error: `สร้างคำสั่งซื้อไม่สำเร็จ: ${orderError?.message}` };

  // 2) รายการในบิล — เก็บ snapshot ชื่อกับราคา ณ เวลาสั่ง
  const { error: itemsError } = await supabase.from("order_items").insert(
    selected.map((i) => ({
      order_id: order.id,
      listing_id: i.listing!.id,
      product_id: i.listing!.product_id,
      product_name: `${i.listing!.product_name} — ${i.listing!.title}`,
      unit_price: i.listing!.price,
      quantity: i.quantity,
    }))
  );

  if (itemsError) {
    // ถ้าใส่รายการไม่สำเร็จ ลบหัวบิลทิ้งไม่ให้เหลือบิลเปล่า
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: `บันทึกรายการสินค้าไม่สำเร็จ: ${itemsError.message}` };
  }

  // 3) ตัดสต็อก / ปิดประกาศที่ขายหมด
  for (const i of selected) {
    const remaining = i.listing!.quantity - i.quantity;
    await supabase
      .from("listings")
      .update({
        quantity: Math.max(remaining, 0),
        status: remaining <= 0 ? "sold" : "active",
      })
      .eq("id", i.listing!.id);
  }

  // 4) เอาของที่ซื้อแล้วออกจากตะกร้า
  await supabase
    .from("cart_items")
    .delete()
    .in(
      "id",
      selected.map((i) => i.id)
    );

  revalidatePath("/cart");
  revalidatePath("/profile");
  revalidatePath("/", "layout");

  redirect(`/checkout/success?order=${order.order_no}`);
}
