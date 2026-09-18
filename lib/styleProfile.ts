import type { StyleProfile } from "@/app/generated/prisma/client";
import { safeParseStringArray } from "@/lib/json";

export type StyleProfileDTO = Omit<StyleProfile, "dominantAesthetics" | "preferredColors"> & {
  dominantAesthetics: string[];
  preferredColors: string[];
};

export function serializeStyleProfile(profile: StyleProfile): StyleProfileDTO {
  return {
    ...profile,
    dominantAesthetics: safeParseStringArray(profile.dominantAesthetics),
    preferredColors: safeParseStringArray(profile.preferredColors),
  };
}
