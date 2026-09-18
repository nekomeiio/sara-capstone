import { NextRequest, NextResponse } from "next/server";
import { serializeWornOutfit } from "@/lib/outfits";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const suggestionId = (await params).id;

  const suggestion = await prisma.generatedSuggestion.findUnique({ where: { id: suggestionId } });
  if (!suggestion) {
    return NextResponse.json({ error: "Suggestion not found." }, { status: 404 });
  }
  if (suggestion.wasAccepted) {
    return NextResponse.json({ error: "This suggestion was already marked as worn." }, { status: 409 });
  }

  const itemIds: string[] = JSON.parse(suggestion.itemIdsJson);
  const existingItems = await prisma.wardrobeItem.findMany({
    where: { id: { in: itemIds } },
    select: { id: true },
  });
  if (existingItems.length === 0) {
    return NextResponse.json(
      { error: "None of this outfit's items exist in your wardrobe anymore." },
      { status: 409 },
    );
  }
  const existingIds = new Set(existingItems.map((item) => item.id));
  const survivingItemIds = itemIds.filter((id) => existingIds.has(id));

  const [wornOutfit] = await prisma.$transaction([
    prisma.wornOutfit.create({
      data: {
        dateWorn: new Date(),
        sourceType: "generated_accepted",
        items: { create: survivingItemIds.map((wardrobeItemId) => ({ wardrobeItemId })) },
      },
      include: { items: { include: { wardrobeItem: true } } },
    }),
    prisma.generatedSuggestion.update({ where: { id: suggestionId }, data: { wasAccepted: true } }),
  ]);

  return NextResponse.json(serializeWornOutfit(wornOutfit), { status: 201 });
}
