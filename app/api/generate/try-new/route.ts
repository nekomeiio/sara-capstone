import { NextResponse } from "next/server";
import { MIN_WARDROBE_ITEMS_FOR_TRY_NEW } from "@/lib/constants";
import { generateTryNewOutfit } from "@/lib/gemini";
import { isDuplicateOrNearDuplicate, pickFallbackOutfit } from "@/lib/outfits";
import { prisma } from "@/lib/prisma";
import { serializeWardrobeItem, toWardrobeContextItem } from "@/lib/wardrobe";

export async function POST() {
  const wardrobeItems = await prisma.wardrobeItem.findMany({ orderBy: { createdAt: "desc" } });

  if (wardrobeItems.length < MIN_WARDROBE_ITEMS_FOR_TRY_NEW) {
    return NextResponse.json(
      {
        error: `Add a few more items to unlock this — you need at least ${MIN_WARDROBE_ITEMS_FOR_TRY_NEW} wardrobe items.`,
      },
      { status: 422 },
    );
  }

  const dtoById = new Map(wardrobeItems.map((item) => [item.id, serializeWardrobeItem(item)]));
  const contextItems = Array.from(dtoById.values()).map(toWardrobeContextItem);

  const wornOutfits = await prisma.wornOutfit.findMany({
    include: { items: true },
    orderBy: { dateWorn: "desc" },
  });
  const pastOutfitIdSets = wornOutfits.map((outfit) => outfit.items.map((item) => item.wardrobeItemId));

  let explanation: string;
  let noveltyNote: string | null;
  let validItemIds: string[];
  let usedFallback = false;

  try {
    let suggestion = await generateTryNewOutfit(contextItems, pastOutfitIdSets);
    validItemIds = suggestion.item_ids.filter((id) => dtoById.has(id));

    if (validItemIds.length === 0 || isDuplicateOrNearDuplicate(validItemIds, pastOutfitIdSets)) {
      suggestion = await generateTryNewOutfit(contextItems, pastOutfitIdSets, validItemIds);
      validItemIds = suggestion.item_ids.filter((id) => dtoById.has(id));
    }

    if (validItemIds.length === 0 || isDuplicateOrNearDuplicate(validItemIds, pastOutfitIdSets)) {
      throw new Error("Gemini couldn't produce a sufficiently novel outfit after a retry");
    }

    explanation = suggestion.explanation;
    noveltyNote = suggestion.novelty_note;
  } catch {
    const fallbackItems = pickFallbackOutfit(Array.from(dtoById.values()), pastOutfitIdSets);
    validItemIds = fallbackItems.map((item) => item.id);
    explanation = "Fresh pick from your less-worn pieces.";
    noveltyNote = null;
    usedFallback = true;
  }

  const saved = await prisma.generatedSuggestion.create({
    data: {
      triggerType: "try_something_new",
      itemIdsJson: JSON.stringify(validItemIds),
      explanation,
      noveltyNote,
    },
  });

  return NextResponse.json({
    suggestionId: saved.id,
    items: validItemIds.map((id) => dtoById.get(id)),
    explanation,
    noveltyNote,
    usedFallback,
  });
}
