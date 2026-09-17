"use client";

import Image from "next/image";
import { useState } from "react";
import type { WardrobeItemDTO } from "@/lib/wardrobe";

const CATEGORY_DISPLAY_ORDER = [
  "dress",
  "top",
  "bottom",
  "outerwear",
  "shoes",
  "bag",
  "accessory",
  "other",
];

type OutfitCardProps = {
  suggestionId: string;
  items: WardrobeItemDTO[];
  explanation: string;
  confidence?: string | null;
  noveltyNote?: string | null;
  onRegenerate: () => void;
  isRegenerating: boolean;
};

export default function OutfitCard({
  suggestionId,
  items,
  explanation,
  confidence,
  noveltyNote,
  onRegenerate,
  isRegenerating,
}: OutfitCardProps) {
  const [wornState, setWornState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const sortedItems = [...items].sort(
    (a, b) => CATEGORY_DISPLAY_ORDER.indexOf(a.category) - CATEGORY_DISPLAY_ORDER.indexOf(b.category),
  );

  const handleMarkAsWorn = async () => {
    setWornState("saving");
    setError(null);
    try {
      const response = await fetch(`/api/outfits/worn/${suggestionId}/accept`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Couldn't mark this outfit as worn.");
      setWornState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't mark this outfit as worn.");
      setWornState("idle");
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/10">
      <div className="flex flex-wrap gap-3">
        {sortedItems.map((item) => (
          <div key={item.id} className="flex flex-col items-center gap-1">
            <div className="relative h-24 w-24 overflow-hidden rounded-md bg-black/5 dark:bg-white/5">
              <Image src={item.imageUrl} alt={item.subcategory} fill className="object-cover" />
            </div>
            <span className="text-xs text-black/60 dark:text-white/60">{item.subcategory}</span>
          </div>
        ))}
      </div>

      <p className="text-sm">{explanation}</p>

      {(confidence || noveltyNote) && (
        <span className="w-fit rounded-full bg-black/5 px-2 py-0.5 text-xs text-black/60 dark:bg-white/10 dark:text-white/60">
          {confidence ? `Confidence: ${confidence}` : noveltyNote}
        </span>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleMarkAsWorn}
          disabled={wornState !== "idle"}
          className="flex-1 rounded-md border border-black/10 px-3 py-2 text-sm disabled:opacity-40 dark:border-white/10"
        >
          {wornState === "done" ? "Marked as worn ✓" : wornState === "saving" ? "Saving…" : "Mark as Worn"}
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="flex-1 rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {isRegenerating ? "Regenerating…" : "Regenerate"}
        </button>
      </div>
    </div>
  );
}
