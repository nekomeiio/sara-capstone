import {
  GoogleGenAI,
  createPartFromBase64,
  createPartFromText,
  createUserContent,
} from "@google/genai";
import { SEASONS, WARDROBE_CATEGORIES } from "@/lib/constants";

// Gemini 1.5 (named in the original plan) was fully retired in 2026 — all
// requests to it 404. These are the current equivalents: a fast/cheap model
// for literal vision tagging, a stronger model for creative reasoning.
// Swap here if Google rotates model names again.
//
// Both roles run on flash-lite first, not the plan's original Pro model:
// - vision: gemini-3.6-flash's free-tier quota is only 20 requests/day/model,
//   which real testing exhausts almost immediately. flash-lite has a much
//   more generous free quota and is exactly the "cheap, fast" tier the plan
//   wants here anyway.
// - reasoning: gemini-3.1-pro has ZERO free-tier quota — Pro tiers require
//   billing enabled on the Cloud project behind the API key. Using flash-lite
//   here trades some reasoning quality for working without billing set up.
//   Swap back to "gemini-3.1-pro-preview" once billing is enabled.
//
// Each role lists a fallback after flash-lite: flash-lite itself has been
// observed returning 503 "high demand" on every single attempt for extended
// stretches (not just an occasional transient blip), which would otherwise
// block uploads entirely. generateJson() tries each model in order, retrying
// with backoff within a model before moving to the next one.
export const GEMINI_MODELS = {
  vision: ["gemini-3.1-flash-lite", "gemini-3.6-flash"],
  reasoning: ["gemini-3.1-flash-lite", "gemini-3.6-flash"],
} as const;

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

const WARDROBE_TAGGING_SCHEMA = {
  type: "object",
  properties: {
    is_clothing_item: {
      type: "boolean",
      description: "false if the image is not a single wearable clothing/accessory item",
    },
    category: { type: "string", enum: [...WARDROBE_CATEGORIES] },
    subcategory: { type: "string", description: "e.g. 'crewneck sweater', 'ankle boot'" },
    primaryColor: { type: "string" },
    secondaryColors: { type: "array", items: { type: "string" } },
    pattern: { type: "string", description: "e.g. 'solid', 'striped', 'floral'" },
    materialGuess: { type: "string", description: "e.g. 'cotton', 'denim', 'leather'" },
    formality: { type: "integer", minimum: 1, maximum: 5 },
    seasons: { type: "array", items: { type: "string", enum: [...SEASONS] } },
    fitStyle: { type: "string", description: "e.g. 'slim', 'oversized', 'regular'" },
    tags: { type: "array", items: { type: "string" } },
  },
  required: [
    "is_clothing_item",
    "category",
    "subcategory",
    "primaryColor",
    "secondaryColors",
    "pattern",
    "materialGuess",
    "formality",
    "seasons",
    "fitStyle",
    "tags",
  ],
};

const WARDROBE_TAGGING_PROMPT = `You are tagging a single photo of a clothing/accessory item for a wardrobe app.
Look at the image and fill in every field of the schema as literally and consistently as possible.
If the image does not clearly show a single wearable clothing item, accessory, bag, or pair of shoes
(e.g. it's a person's face, a landscape, a screenshot, etc.), set is_clothing_item to false and still
fill the other fields with your best guess.
formality is an integer from 1 (very casual, e.g. gym wear) to 5 (very formal, e.g. black-tie).
category must be exactly one of: ${WARDROBE_CATEGORIES.join(", ")}.
seasons must only contain values from: ${SEASONS.join(", ")}.`;

export type WardrobeTaggingResult = {
  is_clothing_item: boolean;
  category: string;
  subcategory: string;
  primaryColor: string;
  secondaryColors: string[];
  pattern: string;
  materialGuess: string;
  formality: number;
  seasons: string[];
  fitStyle: string;
  tags: string[];
};

// Google's own model-overload 503s showed up ~50% of the time in testing
// against gemini-3.6-flash — this isn't hypothetical, so transient HTTP
// errors get retried with backoff alongside the malformed-JSON case.
const TRANSIENT_STATUS_CODES = new Set([429, 500, 503]);

function isTransientError(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  return typeof status === "number" && TRANSIENT_STATUS_CODES.has(status);
}

async function generateJson<T>(params: {
  model: string | readonly string[];
  contents: ReturnType<typeof createUserContent>;
  temperature: number;
  jsonSchema: unknown;
}): Promise<T> {
  const ai = getClient();
  const models = Array.isArray(params.model) ? params.model : [params.model];
  const maxAttemptsPerModel = 3;
  let lastError: unknown;

  for (const model of models) {
    for (let attempt = 0; attempt < maxAttemptsPerModel; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }

      let text: string | undefined;
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            temperature: params.temperature,
            responseMimeType: "application/json",
            responseJsonSchema: params.jsonSchema,
          },
        });
        text = response.text;
      } catch (error) {
        lastError = error;
        console.error(`Gemini call to ${model} failed`, error);
        if (isTransientError(error)) continue;
        break; // non-transient: stop retrying this model, fall through to the next one
      }

      if (!text) {
        lastError = new Error("Gemini returned an empty response");
        continue;
      }

      try {
        return JSON.parse(text) as T;
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw new Error(
    `Gemini call failed after trying ${models.join(", ")}: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

export async function tagWardrobeItemImage(
  imageBase64: string,
  mimeType: string,
): Promise<WardrobeTaggingResult> {
  return generateJson<WardrobeTaggingResult>({
    model: GEMINI_MODELS.vision,
    contents: createUserContent([
      createPartFromText(WARDROBE_TAGGING_PROMPT),
      createPartFromBase64(imageBase64, mimeType),
    ]),
    temperature: 0.2,
    jsonSchema: WARDROBE_TAGGING_SCHEMA,
  });
}

export type WardrobeContextItem = {
  id: string;
  category: string;
  subcategory: string;
  primaryColor: string;
  secondaryColors: string[];
  pattern: string;
  materialGuess: string;
  formality: number;
  seasons: string[];
  fitStyle: string;
  tags: string[];
};

const OUTFIT_SUGGESTION_SCHEMA = {
  type: "object",
  properties: {
    item_ids: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      description: "ids of the chosen items, copied exactly from the provided wardrobe list",
    },
    explanation: { type: "string", description: "1-3 sentences on why this outfit fits the request" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: ["item_ids", "explanation", "confidence"],
};

export type OutfitSuggestionResult = {
  item_ids: string[];
  explanation: string;
  confidence: "high" | "medium" | "low";
};

function buildOutfitPrompt(
  promptText: string,
  wardrobeItems: WardrobeContextItem[],
  styleSummary?: string | null,
): string {
  const styleClause = styleSummary
    ? `\nThe user's overall style profile, derived from their saved inspiration images: "${styleSummary}"
Let this inform the tone and choice of your outfit, without ignoring their specific request below.\n`
    : "";

  return `You are a personal stylist choosing an outfit from the user's real wardrobe.
${styleClause}
The user's wardrobe (the ONLY items you may use) as JSON:
${JSON.stringify(wardrobeItems)}

The user's request: "${promptText}"

Rules:
- Choose item_ids ONLY from the "id" values in the wardrobe list above. Never invent an item or id.
- Build a full outfit: include exactly one item each from the "top", "bottom", "accessory", and "shoes"
  categories, as long as the wardrobe list above contains at least one item in that category. Only skip
  one of these categories if the wardrobe list truly has zero items in it — never fabricate an item to
  fill a category that doesn't exist.
- You may add outerwear, a bag, or an extra accessory on top of those four categories if it fits the
  request, but never at the expense of leaving out a required category that's actually available.
- explanation should be 1-3 sentences addressing how the outfit fits the request.
- confidence should reflect how well the available wardrobe actually matches the request.`;
}

export async function generateOutfitSuggestion(
  promptText: string,
  wardrobeItems: WardrobeContextItem[],
  styleSummary?: string | null,
): Promise<OutfitSuggestionResult> {
  return generateJson<OutfitSuggestionResult>({
    model: GEMINI_MODELS.reasoning,
    contents: createUserContent([
      createPartFromText(buildOutfitPrompt(promptText, wardrobeItems, styleSummary)),
    ]),
    temperature: 0.7,
    jsonSchema: OUTFIT_SUGGESTION_SCHEMA,
  });
}

const TRY_NEW_SCHEMA = {
  type: "object",
  properties: {
    item_ids: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      description: "ids of the chosen items, copied exactly from the provided wardrobe list",
    },
    explanation: { type: "string", description: "1-3 sentences on why this is a good outfit" },
    novelty_note: { type: "string", description: "1 short sentence on what makes this pick fresh/different" },
  },
  required: ["item_ids", "explanation", "novelty_note"],
};

export type TryNewSuggestionResult = {
  item_ids: string[];
  explanation: string;
  novelty_note: string;
};

function buildTryNewPrompt(
  wardrobeItems: WardrobeContextItem[],
  pastOutfitIdSets: string[][],
  avoidItemIds?: string[],
): string {
  const avoidClause = avoidItemIds
    ? `\nYour previous suggestion (ids: ${JSON.stringify(avoidItemIds)}) overlapped too much with something
already worn. Propose a meaningfully different combination this time — swap out at least the pieces
that caused the overlap.`
    : "";

  return `You are a personal stylist proposing a FRESH outfit the user hasn't worn recently, to help them
rediscover underused pieces in their own wardrobe.

The user's wardrobe (the ONLY items you may use) as JSON:
${JSON.stringify(wardrobeItems)}

Outfits the user has already worn (avoid closely repeating any of these combinations), as arrays of
item ids:
${JSON.stringify(pastOutfitIdSets)}
${avoidClause}

Rules:
- Choose item_ids ONLY from the "id" values in the wardrobe list above. Never invent an item or id.
- Only use categories that actually exist in the wardrobe list.
- Prefer a coherent, complete-feeling outfit, but never fabricate items to fill a category.
- Favor pieces that appear rarely or not at all in the past-outfits list above.
- explanation should be 1-3 sentences on why this is a good outfit.
- novelty_note should be one short sentence on what makes this pick fresh or different from what's
  been worn before.`;
}

export async function generateTryNewOutfit(
  wardrobeItems: WardrobeContextItem[],
  pastOutfitIdSets: string[][],
  avoidItemIds?: string[],
): Promise<TryNewSuggestionResult> {
  return generateJson<TryNewSuggestionResult>({
    model: GEMINI_MODELS.reasoning,
    contents: createUserContent([
      createPartFromText(buildTryNewPrompt(wardrobeItems, pastOutfitIdSets, avoidItemIds)),
    ]),
    temperature: 0.7,
    jsonSchema: TRY_NEW_SCHEMA,
  });
}

const INSPIRATION_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    aestheticLabels: {
      type: "array",
      items: { type: "string" },
      description: "short style/aesthetic descriptors, e.g. 'minimalist', 'streetwear', 'cottagecore'",
    },
    colorPalette: { type: "array", items: { type: "string" }, description: "dominant colors visible" },
    silhouetteNotes: { type: "string", description: "notable silhouettes/fits/proportions" },
    formalityRangeMin: { type: "integer", minimum: 1, maximum: 5 },
    formalityRangeMax: { type: "integer", minimum: 1, maximum: 5 },
    moodDescription: { type: "string", description: "1-2 sentence overall mood/vibe" },
  },
  required: [
    "aestheticLabels",
    "colorPalette",
    "silhouetteNotes",
    "formalityRangeMin",
    "formalityRangeMax",
    "moodDescription",
  ],
};

const INSPIRATION_EXTRACTION_PROMPT = `You are analyzing a fashion inspiration image (an outfit photo, mood
board, or style reference) to extract its style attributes for a personal styling app.
Fill in every field of the schema based on what you see.
formalityRangeMin/Max describe the plausible formality range this image's style spans, as integers from
1 (very casual) to 5 (very formal) — most images should have a narrow range (e.g. 2-3), but a versatile
look can span wider.`;

export type InspirationExtractionResult = {
  aestheticLabels: string[];
  colorPalette: string[];
  silhouetteNotes: string;
  formalityRangeMin: number;
  formalityRangeMax: number;
  moodDescription: string;
};

export async function extractInspirationStyle(
  imageBase64: string,
  mimeType: string,
): Promise<InspirationExtractionResult> {
  return generateJson<InspirationExtractionResult>({
    model: GEMINI_MODELS.vision,
    contents: createUserContent([
      createPartFromText(INSPIRATION_EXTRACTION_PROMPT),
      createPartFromBase64(imageBase64, mimeType),
    ]),
    temperature: 0.2,
    jsonSchema: INSPIRATION_EXTRACTION_SCHEMA,
  });
}

export type InspirationContextItem = {
  aestheticLabels: string[];
  colorPalette: string[];
  silhouetteNotes: string;
  formalityRangeMin: number;
  formalityRangeMax: number;
  moodDescription: string;
};

const STYLE_PROFILE_SCHEMA = {
  type: "object",
  properties: {
    dominantAesthetics: { type: "array", items: { type: "string" } },
    preferredColors: { type: "array", items: { type: "string" } },
    formalityComfortMin: { type: "integer", minimum: 1, maximum: 5 },
    formalityComfortMax: { type: "integer", minimum: 1, maximum: 5 },
    styleSummary: {
      type: "string",
      description: "2-4 sentences describing the user's overall aesthetic, for direct use as styling context",
    },
  },
  required: [
    "dominantAesthetics",
    "preferredColors",
    "formalityComfortMin",
    "formalityComfortMax",
    "styleSummary",
  ],
};

export type StyleProfileMergeResult = {
  dominantAesthetics: string[];
  preferredColors: string[];
  formalityComfortMin: number;
  formalityComfortMax: number;
  styleSummary: string;
};

function buildStyleProfilePrompt(inspirationImages: InspirationContextItem[]): string {
  return `You are synthesizing a single overall style profile from a collection of fashion inspiration
images the user has saved.

Extracted attributes from each inspiration image, as JSON:
${JSON.stringify(inspirationImages)}

Merge these into one coherent style profile:
- dominantAesthetics: the aesthetic labels that recur most, deduplicated
- preferredColors: the colors that recur most across the palettes, deduplicated
- formalityComfortMin/Max: the overall formality range this collection suggests (1-5)
- styleSummary: 2-4 sentences describing the user's overall aesthetic in a way a stylist could use
  directly when picking outfits for them`;
}

export async function mergeStyleProfile(
  inspirationImages: InspirationContextItem[],
): Promise<StyleProfileMergeResult> {
  return generateJson<StyleProfileMergeResult>({
    model: GEMINI_MODELS.reasoning,
    contents: createUserContent([createPartFromText(buildStyleProfilePrompt(inspirationImages))]),
    temperature: 0.5,
    jsonSchema: STYLE_PROFILE_SCHEMA,
  });
}
