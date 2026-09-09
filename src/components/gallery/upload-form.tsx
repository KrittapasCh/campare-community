"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { createPhoto, type GalleryState } from "@/app/gallery/actions";
import SubmitButton from "@/components/auth/submit-button";
import ProductPicker from "@/components/product-picker";
import { createClient } from "@/lib/supabase/client";

const initial: GalleryState = {};

const field =
  "mt-1 w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400";

const MAX_MB = 10;

export default function UploadForm() {
  const [state, formAction] = useActionState(createPhoto, initial);

  const [preview, setPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadError(`ไฟล์ใหญ่เกิน ${MAX_MB} MB`);
      return;
    }

    setUploading(true);
    setPreview(URL.createObjectURL(file));

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUploadError("กรุณาเข้าสู่ระบบก่อน");
        setUploading(false);
        return;
      }

      // พาธต้องขึ้นต้นด้วย user id ตาม policy ของ bucket
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("gallery")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) {
        setUploadError(`อัปโหลดไม่สำเร็จ: ${error.message}`);
        setUploading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("gallery").getPublicUrl(path);

      setImageUrl(publicUrl);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ ลองใหม่อีกครั้ง"
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="image_url" value={imageUrl} />

      {/* พื้นที่อัปโหลด */}
      <section>
        <p className="text-sm font-medium">ไฟล์ภาพ *</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 flex w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-ink-200 px-4 py-10 transition hover:border-brand-300 hover:bg-brand-50"
        >
          {preview ? (
            <span className="relative block h-56 w-full max-w-md overflow-hidden rounded-lg">
              <Image
                src={preview}
                alt="ตัวอย่างภาพที่เลือก"
                fill
                unoptimized
                className="object-contain"
              />
            </span>
          ) : (
            <>
              <span className="text-3xl">🖼️</span>
              <span className="text-sm font-medium text-ink-600">
                คลิกเพื่อเลือกไฟล์ภาพ
              </span>
              <span className="text-xs text-ink-400">
                JPG · PNG · WebP ไม่เกิน {MAX_MB} MB
              </span>
            </>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleFile}
          className="hidden"
        />

        {uploading && (
          <p className="mt-2 text-sm text-ink-500">กำลังอัปโหลด…</p>
        )}
        {imageUrl && !uploading && (
          <p className="mt-2 text-sm text-green-600">อัปโหลดไฟล์สำเร็จ</p>
        )}
        {uploadError && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {uploadError}
          </p>
        )}
      </section>

      <div>
        <label htmlFor="title" className="text-sm font-medium">
          ชื่อภาพ
        </label>
        <input
          id="title"
          name="title"
          maxLength={120}
          className={field}
          placeholder="เช่น เย็นวันศุกร์ที่เยาวราช"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ProductPicker
          name="product_id"
          type="camera"
          label="ถ่ายด้วยกล้อง"
          hint="เว้นว่างได้ถ้าไม่อยากระบุ"
        />
        <ProductPicker
          name="lens_id"
          type="lens"
          label="เลนส์ที่ใช้"
          hint="เว้นว่างได้ถ้าไม่อยากระบุ"
        />
      </div>

      <section>
        <p className="text-sm font-medium">ค่าที่ใช้ถ่าย</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-4">
          <label className="block">
            <span className="text-xs text-ink-500">ทางยาวโฟกัส (มม.)</span>
            <input name="shot_focal_mm" type="number" step="0.1" className={field} placeholder="35" />
          </label>
          <label className="block">
            <span className="text-xs text-ink-500">รูรับแสง (f/)</span>
            <input name="shot_aperture" type="number" step="0.1" className={field} placeholder="1.8" />
          </label>
          <label className="block">
            <span className="text-xs text-ink-500">ชัตเตอร์</span>
            <input name="shot_shutter" className={field} placeholder="1/250" />
          </label>
          <label className="block">
            <span className="text-xs text-ink-500">ISO</span>
            <input name="shot_iso" type="number" className={field} placeholder="400" />
          </label>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">วันที่ถ่าย</span>
          <input name="taken_at" type="date" className={field} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">ลิงก์ไฟล์ต้นฉบับ</span>
          <input
            name="original_url"
            type="url"
            className={field}
            placeholder="ลิงก์ RAW/JPEG เต็ม (ถ้ามี)"
          />
        </label>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="rounded-lg bg-ink-50 px-4 py-3 text-xs text-ink-500">
        ภาพจะขึ้นสถานะ <strong>รออนุมัติ</strong> จนกว่าผู้ดูแลจะตรวจสอบ
        ถึงจะแสดงในแกลเลอรีสาธารณะ
      </div>

      <SubmitButton pendingText="กำลังส่ง…">ส่งภาพเข้าแกลเลอรี</SubmitButton>
    </form>
  );
}
