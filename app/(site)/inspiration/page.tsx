"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import UploadDropzone from "@/components/UploadDropzone";
import { useToast } from "@/components/ToastProvider";
import type { InspirationImageDTO } from "@/lib/inspiration";
import type { StyleProfileDTO } from "@/lib/styleProfile";

export default function InspirationPage() {
  const { showToast } = useToast();
  const [images, setImages] = useState<InspirationImageDTO[]>([]);
  const [profile, setProfile] = useState<StyleProfileDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);

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
    try {
      const response = await fetch("/api/style-profile/regenerate", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Couldn't regenerate style profile.");
      setProfile(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't regenerate style profile.");
    } finally {
      setIsRegenerating(false);
    }
  }, [showToast]);

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

  const handleDeleteProfile = async () => {
    setIsDeletingProfile(true);
    try {
      const response = await fetch("/api/style-profile", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Couldn't delete style profile.");
      setProfile(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't delete style profile.");
    } finally {
      setIsDeletingProfile(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="page-title">Inspiration</h1>

      <UploadDropzone
        endpoint="/api/inspiration/upload"
        onUploaded={handleUploaded}
        label="Drag & drop a style inspiration photo, or click to browse"
      />

      {profile && (
        <div className="card flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="section-title">† Your style profile †</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={regenerateProfile}
                disabled={isRegenerating}
                className="btn-outline px-3 py-1 text-xs"
              >
                {isRegenerating ? "Regenerating…" : "Regenerate"}
              </button>
              {images.length === 0 && (
                <button
                  type="button"
                  onClick={handleDeleteProfile}
                  disabled={isDeletingProfile}
                  className="btn-danger px-3 py-1 text-xs"
                >
                  {isDeletingProfile ? "Deleting…" : "Delete profile"}
                </button>
              )}
            </div>
          </div>
          <p className="text-sm">{profile.styleSummary}</p>
          <div className="flex flex-wrap gap-1">
            {profile.dominantAesthetics.map((aesthetic) => (
              <span key={aesthetic} className="pill-tag">
                {aesthetic}
              </span>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="muted-faint">Loading…</p>
      ) : images.length === 0 ? (
        <p className="muted-faint">No inspiration images yet — upload a few to build your style profile.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image) => (
            <div key={image.id} className="tile">
              <div className="thumb">
                <Image src={image.imageUrl} alt={image.moodDescription} fill className="object-cover" />
              </div>
              <p className="text-xs text-black/60 dark:text-white/60">{image.aestheticLabels.join(", ")}</p>
              <button
                type="button"
                onClick={() => handleDelete(image.id)}
                className="btn-danger px-2 py-1 text-xs"
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
