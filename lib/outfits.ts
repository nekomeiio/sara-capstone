import type { OutfitItem, WornOutfit } from "@/app/generated/prisma/client";
import { NOVELTY_OVERLAP_THRESHOLD, RECENT_OUTFITS_FOR_FALLBACK } from "@/lib/constants";
import type { WardrobeItemDTO } from "@/lib/wardrobe";
import { serializeWardrobeItem } from "@/lib/wardrobe";

export function isDuplicateOrNearDuplicate(
  candidateIds: string[],
  pastOutfitIdSets: string[][],
  threshold: number = NOVELTY_OVERLAP_THRESHOLD,
): boolean {
  const candidateSet = new Set(candidateIds);
  for (const pastSet of pastOutfitIdSets) {
    const pastSetAsSet = new Set(pastSet);
    const intersection = [...candidateSet].filter((id) => pastSetAsSet.has(id));
    const overlapRatio = intersection.length / Math.max(candidateSet.size, pastSetAsSet.size);
    if (overlapRatio >= threshold) return true;
  }
  return false;
}

// Fallback when Gemini can't produce a fresh-enough combo after a retry —
// skips AI reasoning entirely and picks one less-recently-worn item per
// category. See plan.md Section 5.
export function pickFallbackOutfit(
  wardrobeItems: WardrobeItemDTO[],
  recentOutfitIdSets: string[][],
): WardrobeItemDTO[] {
  const recentIds = new Set(recentOutfitIdSets.slice(0, RECENT_OUTFITS_FOR_FALLBACK).flat());

  const byCategory = new Map<string, WardrobeItemDTO[]>();
  for (const item of wardrobeItems) {
    const bucket = byCategory.get(item.category) ?? [];
    bucket.push(item);
    byCategory.set(item.category, bucket);
  }

  const picks: WardrobeItemDTO[] = [];
  for (const items of byCategory.values()) {
    const freshItems = items.filter((item) => !recentIds.has(item.id));
    const pool = freshItems.length > 0 ? freshItems : items;
    picks.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return picks;
}

export type WornOutfitDTO = WornOutfit & { items: WardrobeItemDTO[] };

type WornOutfitWithItems = WornOutfit & {
  items: (OutfitItem & { wardrobeItem: Parameters<typeof serializeWardrobeItem>[0] })[];
};

export function serializeWornOutfit(wornOutfit: WornOutfitWithItems): WornOutfitDTO {
  const { items, ...rest } = wornOutfit;
  return {
    ...rest,
    items: items.map((link) => serializeWardrobeItem(link.wardrobeItem)),
  };
}
