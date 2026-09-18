import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const existing = await prisma.wornOutfit.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Worn outfit not found." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.outfitItem.deleteMany({ where: { wornOutfitId: id } }),
    prisma.wornOutfit.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
