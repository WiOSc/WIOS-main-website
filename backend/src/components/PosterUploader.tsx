"use client";

import { useState, useRef } from "react";
import { uploadFiles } from "@/lib/uploadthing";
import { currentIdToken } from "@/lib/firebase-client";

interface PosterUploaderProps {
  posterUrl: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export default function PosterUploader({
  posterUrl,
  onChange,
  disabled = false,
}: PosterUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | File[]) {
    const file = Array.from(files).find((f) => f.type.startsWith("image/"));

    if (!file) {
      setError("Please select a valid image file (PNG, JPG, WebP, etc.).");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const token = await currentIdToken();
      if (!token) {
        throw new Error("You must be signed in as an admin to upload a poster.");
      }

      const res = await uploadFiles("eventPoster", {
        files: [file],
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res || res.length === 0) {
        throw new Error("Upload completed with no file returned.");
      }

      const uploaded = res[0] as { ufsUrl?: string; url: string };
      onChange(uploaded.ufsUrl || uploaded.url);
    } catch (err) {
      console.error("Poster upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload poster.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="font-poppins text-xs font-semibold text-black/70">
          Poster
        </label>
        <span className="font-poppins text-[11px] text-black/40">
          JPG, PNG, WebP up to 4MB
        </span>
      </div>

      {posterUrl ? (
        <div className="relative flex flex-col gap-2 rounded-xl border border-black/10 bg-white p-2.5 shadow-sm">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterUrl}
              alt="Event poster"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={disabled}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-red-600 disabled:opacity-50"
              title="Remove poster"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !uploading) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (!disabled && !uploading && e.dataTransfer.files) {
              void handleFiles(e.dataTransfer.files);
            }
          }}
          onClick={() => {
            if (!disabled && !uploading) fileInputRef.current?.click();
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            dragOver
              ? "border-[#8D7FB5] bg-[#8D7FB5]/10"
              : "border-black/15 bg-black/[0.02] hover:border-[#8D7FB5]/50 hover:bg-black/[0.04]"
          } ${disabled || uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files);
            }}
          />

          <svg
            className="mb-2 h-8 w-8 text-[#8D7FB5]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>

          <p className="font-poppins text-xs font-semibold text-black">
            {uploading ? (
              <span className="flex items-center gap-2 text-[#8D7FB5]">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Uploading poster to UploadThing...
              </span>
            ) : (
              <>Click or drag an image here to upload</>
            )}
          </p>
        </div>
      )}

      {error && <p className="font-poppins text-xs text-red-500">{error}</p>}
    </div>
  );
}
