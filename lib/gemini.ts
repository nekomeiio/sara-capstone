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
// Vision uses the "-lite" tier specifically: gemini-3.6-flash's free-tier
// quota is only 20 requests/day/model, which real testing exhausts almost
// immediately. flash-lite has a much more generous free quota and is exactly
// the "cheap, fast" tier the plan calls for here anyway.
export const GEMINI_MODELS = {
  vision: "gemini-3.1-flash-lite",
  reasoning: "gemini-3.1-pro-preview",
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
  model: string;
  contents: ReturnType<typeof createUserContent>;
  temperature: number;
  jsonSchema: unknown;
}): Promise<T> {
  const ai = getClient();
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }

    let text: string | undefined;
    try {
      const response = await ai.models.generateContent({
        model: params.model,
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
      if (isTransientError(error)) continue;
      throw error;
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

  throw new Error(
    `Gemini call failed after ${maxAttempts} attempts: ${
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
