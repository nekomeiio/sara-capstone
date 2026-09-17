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
