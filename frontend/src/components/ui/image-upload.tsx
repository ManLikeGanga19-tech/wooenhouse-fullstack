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
}

export function ImageUpload({ value, onChange, onBusyChange }: ImageUploadProps) {
  const inputRef   = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const previewSrc = value
    ? (value.startsWith("http") ? value : `${API_URL}${value}`)
    : null;

  const handleFile = async (file: File) => {
    setUploading(true);
    onBusyChange?.(true);
    try {
      const { data } = await api.admin.upload.image(file);
      onChange(data.url);
    } catch (err) {
      toast.error("Upload failed", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setUploading(false);
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
            <div className="w-8 h-8 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin" />
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
