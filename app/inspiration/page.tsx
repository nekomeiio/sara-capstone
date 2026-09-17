"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import UploadDropzone from "@/components/UploadDropzone";
import type { InspirationImageDTO } from "@/lib/inspiration";
import type { StyleProfileDTO } from "@/lib/styleProfile";

export default function InspirationPage() {
  const [images, setImages] = useState<InspirationImageDTO[]>([]);
  const [profile, setProfile] = useState<StyleProfileDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      fetch("/api/inspiration").then((r) => r.json()),
      fetch("/api/style-profile").then((r) => r.json()),
    ])
      .then(([imgs, prof]) => {
        if (!ignore) {
          setImages(imgs);
          setProfile(prof);
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const regenerateProfile = useCallback(async () => {
    setIsRegenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/style-profile/regenerate", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Couldn't regenerate style profile.");
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't regenerate style profile.");
    } finally {
      setIsRegenerating(false);
    }
  }, []);

  const handleUploaded = (result: unknown) => {
    setImages((prev) => [result as InspirationImageDTO, ...prev]);
    regenerateProfile();
  };

  const handleDelete = async (id: string) => {
    const previous = images;
    setImages((prev) => prev.filter((image) => image.id !== id));
    const response = await fetch(`/api/inspiration/${id}`, { method: "DELETE" });
    if (!response.ok) setImages(previous);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Inspiration</h1>

      <UploadDropzone
        endpoint="/api/inspiration/upload"
        onUploaded={handleUploaded}
        label="Drag & drop a style inspiration photo, or click to browse"
      />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {profile && (
        <div className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 dark:border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Your style profile</h2>
            <button
              type="button"
              onClick={regenerateProfile}
              disabled={isRegenerating}
              className="rounded-md border border-black/10 px-3 py-1 text-xs disabled:opacity-50 dark:border-white/10"
            >
              {isRegenerating ? "Regenerating…" : "Regenerate"}
            </button>
          </div>
          <p className="text-sm">{profile.styleSummary}</p>
          <div className="flex flex-wrap gap-1">
            {profile.dominantAesthetics.map((aesthetic) => (
              <span
                key={aesthetic}
                className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-black/60 dark:bg-white/10 dark:text-white/60"
              >
                {aesthetic}
              </span>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-black/40 dark:text-white/40">Loading…</p>
      ) : images.length === 0 ? (
        <p className="text-sm text-black/40 dark:text-white/40">
          No inspiration images yet — upload a few to build your style profile.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="flex flex-col gap-2 rounded-md border border-black/10 p-2 dark:border-white/10"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-md bg-black/5 dark:bg-white/5">
                <Image src={image.imageUrl} alt={image.moodDescription} fill className="object-cover" />
              </div>
              <p className="text-xs text-black/60 dark:text-white/60">{image.aestheticLabels.join(", ")}</p>
              <button
                type="button"
                onClick={() => handleDelete(image.id)}
                className="rounded-md border border-black/10 px-2 py-1 text-xs text-red-600 dark:border-white/10 dark:text-red-400"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
