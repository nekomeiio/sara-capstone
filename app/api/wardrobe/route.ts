import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeWardrobeItem } from "@/lib/wardrobe";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const formality = searchParams.get("formality");

  const items = await prisma.wardrobeItem.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(formality ? { formality: Number(formality) } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items.map(serializeWardrobeItem));
}
