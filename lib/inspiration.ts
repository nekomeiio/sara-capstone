import type { InspirationImage } from "@/app/generated/prisma/client";
import type { InspirationContextItem } from "@/lib/gemini";
import { safeParseStringArray } from "@/lib/json";

export type InspirationImageDTO = Omit<
  InspirationImage,
  "aestheticLabels" | "colorPalette" | "imageData" | "imageMimeType"
> & {
  aestheticLabels: string[];
  colorPalette: string[];
  imageUrl: string;
};

export function serializeInspirationImage(item: InspirationImage): InspirationImageDTO {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { imageData, imageMimeType, ...rest } = item;
  return {
    ...rest,
    aestheticLabels: safeParseStringArray(item.aestheticLabels),
    colorPalette: safeParseStringArray(item.colorPalette),
    imageUrl: `/api/inspiration/${item.id}/image`,
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
