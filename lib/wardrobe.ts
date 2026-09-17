import type { WardrobeItem } from "@/app/generated/prisma/client";
import type { WardrobeContextItem } from "@/lib/gemini";
import { safeParseStringArray } from "@/lib/json";

export type WardrobeItemDTO = Omit<
  WardrobeItem,
  "secondaryColors" | "seasons" | "tags"
> & {
  secondaryColors: string[];
  seasons: string[];
  tags: string[];
};

export function serializeWardrobeItem(item: WardrobeItem): WardrobeItemDTO {
  return {
    ...item,
    secondaryColors: safeParseStringArray(item.secondaryColors),
    seasons: safeParseStringArray(item.seasons),
    tags: safeParseStringArray(item.tags),
  };
}

export function toWardrobeContextItem(item: WardrobeItemDTO): WardrobeContextItem {
  return {
    id: item.id,
    category: item.category,
    subcategory: item.subcategory,
    primaryColor: item.primaryColor,
    secondaryColors: item.secondaryColors,
    pattern: item.pattern,
    materialGuess: item.materialGuess,
    formality: item.formality,
    seasons: item.seasons,
    fitStyle: item.fitStyle,
    tags: item.tags,
  };
}
