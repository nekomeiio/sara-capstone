"use client";

import { useCallback, useRef, useState } from "react";

type UploadDropzoneProps = {
  endpoint: string;
  onUploaded: (result: unknown) => void;
  label?: string;
};

export default function UploadDropzone({
  endpoint,
  onUploaded,
  label = "Drag & drop an image, or click to browse",
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(endpoint, { method: "POST", body: formData });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Upload failed.");
        }
        onUploaded(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setIsUploading(false);
      }
    },
    [endpoint, onUploaded],
  );

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={`cursor-pointer rounded-md border-2 border-dashed p-8 text-center text-sm transition-colors ${
          isDragging
            ? "border-black bg-black/5 dark:border-white dark:bg-white/5"
            : "border-black/20 dark:border-white/20"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
            event.target.value = "";
          }}
        />
        <p className="text-black/60 dark:text-white/60">
          {isUploading ? "Analyzing image…" : label}
        </p>
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
