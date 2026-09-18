import type { WardrobeItem } from "@/app/generated/prisma/client";
import type { WardrobeContextItem } from "@/lib/gemini";
import { safeParseStringArray } from "@/lib/json";

export type WardrobeItemDTO = Omit<
  WardrobeItem,
  "secondaryColors" | "seasons" | "tags" | "imageData" | "imageMimeType"
> & {
  secondaryColors: string[];
  seasons: string[];
  tags: string[];
  imageUrl: string;
};

export function serializeWardrobeItem(item: WardrobeItem): WardrobeItemDTO {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { imageData, imageMimeType, ...rest } = item;
  return {
    ...rest,
    secondaryColors: safeParseStringArray(item.secondaryColors),
    seasons: safeParseStringArray(item.seasons),
    tags: safeParseStringArray(item.tags),
    imageUrl: `/api/wardrobe/${item.id}/image`,
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
