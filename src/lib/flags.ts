/**
 * สวิตช์เปิด/ปิดพฤติกรรมบางอย่างตอนเดโม
 *
 * ปกติระบบห้ามผู้ขายซื้อประกาศของตัวเอง (business rule ที่ถูกต้อง)
 * แต่ตอนนำเสนอมักมี user บัญชีเดียว เลยเปิดช่องให้ข้ามกฎนี้ได้ชั่วคราว
 *
 * ตั้งค่าใน .env.local:  ALLOW_SELF_PURCHASE=true
 * เอาออก/ตั้งเป็น false เมื่อส่งงานจริง
 */
export const allowSelfPurchase = process.env.ALLOW_SELF_PURCHASE === "true";
