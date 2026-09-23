import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeStyleProfile } from "@/lib/styleProfile";

export async function GET() {
  const profile = await prisma.styleProfile.findUnique({ where: { id: "singleton" } });
  return NextResponse.json(profile ? serializeStyleProfile(profile) : null);
}

export async function DELETE() {
  const remainingImages = await prisma.inspirationImage.count();
  if (remainingImages > 0) {
    return NextResponse.json(
      { error: "Delete all inspiration images before deleting your style profile." },
      { status: 409 },
    );
  }

  try {
    await prisma.styleProfile.delete({ where: { id: "singleton" } });
  } catch {
    return NextResponse.json({ error: "Style profile not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
