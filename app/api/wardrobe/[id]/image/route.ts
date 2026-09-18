import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const item = await prisma.wardrobeItem.findUnique({
    where: { id },
    select: { imageData: true, imageMimeType: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(item.imageData), {
    headers: {
      "Content-Type": item.imageMimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
