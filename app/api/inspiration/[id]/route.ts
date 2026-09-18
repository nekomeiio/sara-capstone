import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteUploadedImage } from "@/lib/uploads";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const item = await prisma.inspirationImage.delete({ where: { id } });
    await deleteUploadedImage(item.imageUrl);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Inspiration image not found." }, { status: 404 });
  }
}
