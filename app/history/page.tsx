"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import LogWornOutfitForm from "@/components/LogWornOutfitForm";
import type { WornOutfitDTO } from "@/lib/outfits";

export default function HistoryPage() {
  const [wornOutfits, setWornOutfits] = useState<WornOutfitDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    fetch("/api/outfits/worn")
      .then((response) => response.json())
      .then((data) => {
        if (!ignore) setWornOutfits(data);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Worn history</h1>

      <LogWornOutfitForm onLogged={(wornOutfit) => setWornOutfits((prev) => [wornOutfit, ...prev])} />

      {isLoading ? (
        <p className="text-sm text-black/40 dark:text-white/40">Loading…</p>
      ) : wornOutfits.length === 0 ? (
        <p className="text-sm text-black/40 dark:text-white/40">
          No worn outfits logged yet — the calendar view comes in Phase 6.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {wornOutfits.map((outfit) => (
            <div
              key={outfit.id}
              className="flex flex-col gap-2 rounded-lg border border-black/10 p-3 dark:border-white/10"
            >
              <div className="flex items-center justify-between text-xs text-black/60 dark:text-white/60">
                <span>{new Date(outfit.dateWorn).toLocaleDateString()}</span>
                <span>{outfit.sourceType === "generated_accepted" ? "AI suggestion" : "Logged manually"}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {outfit.items.map((item) => (
                  <div key={item.id} className="relative h-14 w-14 overflow-hidden rounded-md">
                    <Image src={item.imageUrl} alt={item.subcategory} fill className="object-cover" />
                  </div>
                ))}
              </div>
              {outfit.contextNote && <p className="text-sm">{outfit.contextNote}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
