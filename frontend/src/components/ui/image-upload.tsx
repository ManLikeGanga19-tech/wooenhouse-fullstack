"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onBusyChange?: (busy: boolean) => void;
  folder?: string;
}

export function ImageUpload({ value, onChange, onBusyChange, folder = "wooden-houses-kenya/uploads" }: ImageUploadProps) {
  const inputRef    = useRef<HTMLInputElement>(null);
  const [uploading, setUploading]   = useState(false);
  const [progress,  setProgress]    = useState(0);

  const previewSrc = value
    ? (value.startsWith("http") ? value : `${API_URL}${value}`)
    : null;

  const handleFile = async (file: File) => {
    setUploading(true);
    setProgress(0);
    onBusyChange?.(true);
    try {
      // 1. Get a short-lived signed token from our backend (tiny request, no file bytes)
      const { data: sig } = await api.admin.upload.signature(folder);

      // 2. POST the file directly from the browser to Cloudinary — bypasses Render entirely
      const fd = new FormData();
      fd.append("file",      file);
      fd.append("api_key",   sig.apiKey);
      fd.append("timestamp", sig.timestamp.toString());
      fd.append("signature", sig.signature);
      fd.append("folder",    sig.folder);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", sig.uploadUrl);
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const result = JSON.parse(xhr.responseText) as { secure_url: string };
            onChange(result.secure_url);
            resolve();
          } else {
            const err = JSON.parse(xhr.responseText) as { error?: { message?: string } };
            reject(new Error(err.error?.message ?? `Upload failed (${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(fd);
      });
    } catch (err) {
      toast.error("Upload failed", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setUploading(false);
      setProgress(0);
      onBusyChange?.(false);
    }
  };

  return (
    <div
      className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-[#8B5E3C] transition-colors"
      style={{ minHeight: 120 }}
      onClick={() => !uploading && inputRef.current?.click()}
    >
      {previewSrc ? (
        <>
          <img src={previewSrc} alt="preview" className="w-full h-36 object-cover" />
          <button
            type="button"
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow"
            onClick={e => { e.stopPropagation(); onChange(""); }}
          >
            <X size={12} />
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-6 text-gray-400 select-none">
          {uploading ? (
            <div className="w-full flex flex-col items-center gap-2 px-2">
              <div className="w-8 h-8 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin" />
              {progress > 0 && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-200"
                      style={{ width: `${progress}%`, backgroundColor: "#8B5E3C" }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{progress}%</p>
                </>
              )}
            </div>
          ) : (
            <>
              <Upload size={22} className="mb-2" />
              <p className="text-sm font-medium">Click to upload</p>
              <p className="text-xs mt-1">JPG, PNG, WebP · MP4, MOV · Max 200 MB</p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/avi,video/webm"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
