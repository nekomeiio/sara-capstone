"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import TagEditModal from "@/components/TagEditModal";
import UploadDropzone from "@/components/UploadDropzone";
import type { WardrobeItemDTO } from "@/lib/wardrobe";

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItemDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<WardrobeItemDTO | null>(null);

  useEffect(() => {
    let ignore = false;

    fetch("/api/wardrobe")
      .then((response) => {
        if (!response.ok) throw new Error("Couldn't load wardrobe.");
        return response.json();
      })
      .then((data) => {
        if (!ignore) setItems(data);
      })
      .catch((err) => {
        if (!ignore) {
          setListError(err instanceof Error ? err.message : "Couldn't load wardrobe.");
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleDelete = async (id: string) => {
    const previous = items;
    setItems((prev) => prev.filter((item) => item.id !== id));
    const response = await fetch(`/api/wardrobe/${id}`, { method: "DELETE" });
    if (!response.ok) setItems(previous);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="page-title">Wardrobe</h1>

      <UploadDropzone
        endpoint="/api/wardrobe/upload"
        onUploaded={(item) => setItems((prev) => [item as WardrobeItemDTO, ...prev])}
        label="Drag & drop a clothing photo, or click to browse"
      />

      {listError && <p className="text-sm text-red-600 dark:text-red-400">{listError}</p>}

      {isLoading ? (
        <p className="muted-faint">Loading…</p>
      ) : items.length === 0 ? (
        <p className="muted-faint">No wardrobe items yet — upload a few photos to get started.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="tile">
              <div className="thumb">
                <Image
                  src={item.imageUrl}
                  alt={item.subcategory}
                  fill
                  sizes="(max-width: 768px) 45vw, 20vw"
                  className="object-cover"
                />
              </div>
              <div className="text-xs">
                <p className="font-medium">
                  {item.category} · {item.subcategory}
                </p>
                <p className="text-black/60 dark:text-white/60">{item.primaryColor}</p>
                {!item.userConfirmed && (
                  <p className="text-amber-600 dark:text-amber-400">Unreviewed</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(item)}
                  className="btn-outline flex-1 px-2 py-1 text-xs"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="btn-danger flex-1 px-2 py-1 text-xs"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingItem && (
        <TagEditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={(updated) => {
            setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}
