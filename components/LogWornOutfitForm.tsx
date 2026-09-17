"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { todayDateKey } from "@/lib/dates";
import type { WardrobeItemDTO } from "@/lib/wardrobe";
import type { WornOutfitDTO } from "@/lib/outfits";

type LogWornOutfitFormProps = {
  onLogged: (wornOutfit: WornOutfitDTO) => void;
};

export default function LogWornOutfitForm({ onLogged }: LogWornOutfitFormProps) {
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItemDTO[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dateWorn, setDateWorn] = useState(todayDateKey());
  const [contextNote, setContextNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch("/api/wardrobe")
      .then((response) => response.json())
      .then((data) => {
        if (!ignore) setWardrobeItems(data);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      setError("Select at least one item.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/outfits/worn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemIds: Array.from(selectedIds),
          dateWorn,
          contextNote: contextNote.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Couldn't log this outfit.");
      onLogged(data);
      setSelectedIds(new Set());
      setContextNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't log this outfit.");
    } finally {
      setIsSaving(false);
    }
  };

  if (wardrobeItems.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/10">
      <h2 className="text-sm font-medium">Log a worn outfit</h2>

      <div className="flex flex-wrap gap-2">
        {wardrobeItems.map((item) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleItem(item.id)}
              className={`relative h-16 w-16 overflow-hidden rounded-md ring-2 ${
                isSelected ? "ring-black dark:ring-white" : "ring-transparent"
              }`}
            >
              <Image src={item.imageUrl} alt={item.subcategory} fill className="object-cover" />
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Date worn
          <input
            type="date"
            value={dateWorn}
            onChange={(e) => setDateWorn(e.target.value)}
            className="rounded-md border border-black/10 p-2 text-sm dark:border-white/10 dark:bg-neutral-800"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Note (optional)
          <input
            type="text"
            value={contextNote}
            onChange={(e) => setContextNote(e.target.value)}
            placeholder="e.g. date night"
            className="rounded-md border border-black/10 p-2 text-sm dark:border-white/10 dark:bg-neutral-800"
          />
        </label>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {isSaving ? "Saving…" : "Log outfit"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
