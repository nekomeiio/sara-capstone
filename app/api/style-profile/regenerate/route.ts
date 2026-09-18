import { NextResponse } from "next/server";
import { mergeStyleProfile } from "@/lib/gemini";
import { serializeInspirationImage, toInspirationContextItem } from "@/lib/inspiration";
import { prisma } from "@/lib/prisma";
import { serializeStyleProfile } from "@/lib/styleProfile";

export async function POST() {
  const inspirationImages = await prisma.inspirationImage.findMany();
  if (inspirationImages.length === 0) {
    return NextResponse.json(
      { error: "Add a few inspiration images before generating a style profile." },
      { status: 422 },
    );
  }

  const contextItems = inspirationImages.map(serializeInspirationImage).map(toInspirationContextItem);

  let merged;
  try {
    merged = await mergeStyleProfile(contextItems);
  } catch {
    return NextResponse.json(
      { error: "Couldn't generate a style profile. Please try again." },
      { status: 502 },
    );
  }

  const data = {
    dominantAesthetics: JSON.stringify(merged.dominantAesthetics),
    preferredColors: JSON.stringify(merged.preferredColors),
    formalityComfortMin: merged.formalityComfortMin,
    formalityComfortMax: merged.formalityComfortMax,
    styleSummary: merged.styleSummary,
  };

  const profile = await prisma.styleProfile.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });

  return NextResponse.json(serializeStyleProfile(profile));
}
