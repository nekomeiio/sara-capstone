export const WARDROBE_CATEGORIES = [
  "top",
  "bottom",
  "dress",
  "outerwear",
  "shoes",
  "accessory",
  "bag",
  "other",
] as const;

export type WardrobeCategory = (typeof WARDROBE_CATEGORIES)[number];

export const SEASONS = ["spring", "summer", "fall", "winter"] as const;

export type Season = (typeof SEASONS)[number];

// "Try Something New" tuning — see plan.md Section 5/8. Kept as named
// constants (not inline magic numbers) since the plan calls the overlap
// threshold out as something to tune.
export const NOVELTY_OVERLAP_THRESHOLD = 0.75;
export const MIN_WARDROBE_ITEMS_FOR_TRY_NEW = 5;
export const RECENT_OUTFITS_FOR_FALLBACK = 5;
