import type { InspirationImage } from "@/app/generated/prisma/client";
import type { InspirationContextItem } from "@/lib/gemini";
import { safeParseStringArray } from "@/lib/json";

export type InspirationImageDTO = Omit<InspirationImage, "aestheticLabels" | "colorPalette"> & {
  aestheticLabels: string[];
  colorPalette: string[];
};

export function serializeInspirationImage(item: InspirationImage): InspirationImageDTO {
  return {
    ...item,
    aestheticLabels: safeParseStringArray(item.aestheticLabels),
    colorPalette: safeParseStringArray(item.colorPalette),
  };
}

export function toInspirationContextItem(item: InspirationImageDTO): InspirationContextItem {
  return {
    aestheticLabels: item.aestheticLabels,
    colorPalette: item.colorPalette,
    silhouetteNotes: item.silhouetteNotes,
    formalityRangeMin: item.formalityRangeMin,
    formalityRangeMax: item.formalityRangeMax,
    moodDescription: item.moodDescription,
  };
}
