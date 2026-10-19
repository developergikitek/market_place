"use client";

import { useRef, useState } from "react";
import { Check, ImagePlus, Loader2, X } from "lucide-react";
import { ApiError, uploadProductImage } from "@/services/addProductService";
import styles from "./addProduct.module.css";

export interface UploadedImage {
  key: string;
  preview: string;
  url?: string;
  status: "uploading" | "done" | "error";
  error?: string;
}

export const MAX_IMAGES = 8;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED.includes(file.type)) return "Use JPG, PNG or WEBP";
  if (file.size > MAX_BYTES) return "Larger than 5 MB";
  return null;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (update: (prev: UploadedImage[]) => UploadedImage[]) => void;
  invalid?: boolean;
}

export default function ImageUploader({ images, onChange, invalid }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const room = MAX_IMAGES - images.length;
    const files = Array.from(fileList).slice(0, Math.max(room, 0));

    for (const file of files) {
      const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const preview = URL.createObjectURL(file);
      const problem = validateImageFile(file);
      onChange((prev) => [...prev, { key, preview, status: problem ? "error" : "uploading", error: problem ?? undefined }]);
      if (problem) continue;

      uploadProductImage(file)
        .then((url) => onChange((prev) => prev.map((img) => (img.key === key ? { ...img, url, status: "done" } : img))))
        .catch((err) => {
          const message = err instanceof ApiError ? err.messages[0] : "Upload failed";
          onChange((prev) => prev.map((img) => (img.key === key ? { ...img, status: "error", error: message } : img)));
        });
    }
  }

  function remove(key: string) {
    onChange((prev) => prev.filter((img) => img.key !== key));
  }

  function makeMain(key: string) {
    onChange((prev) => {
      const target = prev.find((img) => img.key === key);
      return target ? [target, ...prev.filter((img) => img.key !== key)] : prev;
    });
  }

  return (
    <div>
      {images.length < MAX_IMAGES && (
        <div
          className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ""} ${invalid ? styles.invalid : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            multiple
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <ImagePlus size={26} color="#64748b" />
          <strong>Drag photos here or click to upload</strong>
          <span>
            {images.length}/{MAX_IMAGES} added · JPG, PNG or WEBP up to 5 MB
          </span>
        </div>
      )}

      {images.length > 0 && (
        <div className={styles.imageGrid}>
          {images.map((img, i) => (
            <div key={img.key} className={styles.imageTile}>
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={img.preview} alt={`Product photo ${i + 1}`} />
              {i === 0 && img.status !== "error" && <span className={styles.imageBadge}>MAIN</span>}
              {img.status === "uploading" && (
                <div className={styles.imageOverlay}>
                  <Loader2 size={18} className={styles.spin} />
                </div>
              )}
              {img.status === "error" && (
                <div className={`${styles.imageOverlay} ${styles.imageOverlayError}`}>{img.error}</div>
              )}
              <div className={styles.imageActions}>
                {i !== 0 && img.status === "done" ? (
                  <button type="button" onClick={() => makeMain(img.key)}>
                    Make main
                  </button>
                ) : (
                  <span />
                )}
                <button type="button" onClick={() => remove(img.key)} aria-label="Remove photo">
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.guidelines}>
        <span><Check size={13} /> Plain white or light background</span>
        <span><Check size={13} /> Product fills most of the frame</span>
        <span><Check size={13} /> No watermarks, logos or price text</span>
        <span><Check size={13} /> At least 1000 × 1000 px</span>
      </div>
    </div>
  );
}
