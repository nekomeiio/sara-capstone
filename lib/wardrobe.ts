import type { WardrobeItem } from "@/app/generated/prisma/client";

export type WardrobeItemDTO = Omit<
  WardrobeItem,
  "secondaryColors" | "seasons" | "tags"
> & {
  secondaryColors: string[];
  seasons: string[];
  tags: string[];
};

function safeParseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function serializeWardrobeItem(item: WardrobeItem): WardrobeItemDTO {
  return {
    ...item,
    secondaryColors: safeParseStringArray(item.secondaryColors),
    seasons: safeParseStringArray(item.seasons),
    tags: safeParseStringArray(item.tags),
  };
}
