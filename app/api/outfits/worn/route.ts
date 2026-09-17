import { NextRequest, NextResponse } from "next/server";
import { serializeWornOutfit } from "@/lib/outfits";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit")) || DEFAULT_PAGE_SIZE;
  const offset = Number(searchParams.get("offset")) || 0;

  const wornOutfits = await prisma.wornOutfit.findMany({
    include: { items: { include: { wardrobeItem: true } } },
    orderBy: { dateWorn: "desc" },
    take: limit,
    skip: offset,
  });

  return NextResponse.json(wornOutfits.map(serializeWornOutfit));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const { itemIds, dateWorn, contextNote } = body as {
    itemIds?: unknown;
    dateWorn?: unknown;
    contextNote?: unknown;
  };

  if (!Array.isArray(itemIds) || itemIds.length === 0 || !itemIds.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "itemIds must be a non-empty array of wardrobe item ids." }, { status: 400 });
  }

  const parsedDate = typeof dateWorn === "string" ? new Date(dateWorn) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "dateWorn must be a valid date." }, { status: 400 });
  }

  const existingCount = await prisma.wardrobeItem.count({ where: { id: { in: itemIds } } });
  if (existingCount !== itemIds.length) {
    return NextResponse.json({ error: "One or more itemIds don't exist in your wardrobe." }, { status: 400 });
  }

  const wornOutfit = await prisma.wornOutfit.create({
    data: {
      dateWorn: parsedDate,
      contextNote: typeof contextNote === "string" && contextNote.trim() ? contextNote.trim() : null,
      sourceType: "logged_manually",
      items: {
        create: itemIds.map((wardrobeItemId) => ({ wardrobeItemId })),
      },
    },
    include: { items: { include: { wardrobeItem: true } } },
  });

  return NextResponse.json(serializeWornOutfit(wornOutfit), { status: 201 });
}
