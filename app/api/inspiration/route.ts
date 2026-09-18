import { NextResponse } from "next/server";
import { serializeInspirationImage } from "@/lib/inspiration";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const images = await prisma.inspirationImage.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(images.map(serializeInspirationImage));
}
