import { NextResponse } from "next/server";
import { generateOutfitSuggestion } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { serializeWardrobeItem, toWardrobeContextItem } from "@/lib/wardrobe";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body with promptText." }, { status: 400 });
  }

  const promptText = (body as { promptText?: unknown })?.promptText;
  if (typeof promptText !== "string" || promptText.trim().length === 0) {
    return NextResponse.json({ error: "promptText is required." }, { status: 400 });
  }

  const wardrobeItems = await prisma.wardrobeItem.findMany({ orderBy: { createdAt: "desc" } });
  if (wardrobeItems.length === 0) {
    return NextResponse.json(
      { error: "Your wardrobe is empty — add a few items before generating an outfit." },
      { status: 422 },
    );
  }

  const dtoById = new Map(wardrobeItems.map((item) => [item.id, serializeWardrobeItem(item)]));
  const styleProfile = await prisma.styleProfile.findUnique({ where: { id: "singleton" } });

  let suggestion;
  try {
    suggestion = await generateOutfitSuggestion(
      promptText,
      Array.from(dtoById.values()).map(toWardrobeContextItem),
      styleProfile?.styleSummary,
    );
  } catch {
    return NextResponse.json(
      { error: "Couldn't generate an outfit. Please try again." },
      { status: 502 },
    );
  }

  const validItemIds = suggestion.item_ids.filter((id) => dtoById.has(id));
  if (validItemIds.length === 0) {
    return NextResponse.json(
      { error: "Couldn't generate a valid outfit from your wardrobe. Please try again." },
      { status: 502 },
    );
  }

  const saved = await prisma.generatedSuggestion.create({
    data: {
      triggerType: "prompt",
      promptText,
      itemIdsJson: JSON.stringify(validItemIds),
      explanation: suggestion.explanation,
      confidence: suggestion.confidence,
    },
  });

  return NextResponse.json({
    suggestionId: saved.id,
    items: validItemIds.map((id) => dtoById.get(id)),
    explanation: suggestion.explanation,
    confidence: suggestion.confidence,
  });
}
