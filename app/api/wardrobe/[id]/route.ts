import { NextRequest, NextResponse } from "next/server";
import { WARDROBE_CATEGORIES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { deleteUploadedImage } from "@/lib/uploads";
import { serializeWardrobeItem } from "@/lib/wardrobe";

const STRING_FIELDS = [
  "subcategory",
  "primaryColor",
  "pattern",
  "materialGuess",
  "fitStyle",
] as const;

const ARRAY_FIELDS = ["secondaryColors", "seasons", "tags"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, string | number | boolean> = { userConfirmed: true };

  if (typeof body.category === "string" && (WARDROBE_CATEGORIES as readonly string[]).includes(body.category)) {
    data.category = body.category;
  }
  for (const field of STRING_FIELDS) {
    if (typeof body[field] === "string") data[field] = body[field];
  }
  if (typeof body.formality === "number") {
    data.formality = body.formality;
  }
  for (const field of ARRAY_FIELDS) {
    if (Array.isArray(body[field])) data[field] = JSON.stringify(body[field]);
  }

  try {
    const item = await prisma.wardrobeItem.update({ where: { id }, data });
    return NextResponse.json(serializeWardrobeItem(item));
  } catch {
    return NextResponse.json({ error: "Wardrobe item not found." }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const item = await prisma.wardrobeItem.delete({ where: { id } });
    await deleteUploadedImage(item.imageUrl);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Wardrobe item not found." }, { status: 404 });
  }
}
