import { NextResponse } from "next/server";
import { extractInspirationStyle } from "@/lib/gemini";
import { serializeInspirationImage } from "@/lib/inspiration";
import { prisma } from "@/lib/prisma";
import { readUploadedImage } from "@/lib/uploads";

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data with a file." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image file provided." }, { status: 400 });
  }

  let saved: Awaited<ReturnType<typeof readUploadedImage>>;
  try {
    saved = await readUploadedImage(file);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't read image." },
      { status: 400 },
    );
  }

  let extracted;
  try {
    extracted = await extractInspirationStyle(saved.buffer.toString("base64"), saved.mimeType);
  } catch (error) {
    console.error("Inspiration image analysis failed", error);
    return NextResponse.json(
      { error: "Couldn't analyze this image. Please try again." },
      { status: 502 },
    );
  }

  const item = await prisma.inspirationImage.create({
    data: {
      imageData: saved.buffer,
      imageMimeType: saved.mimeType,
      aestheticLabels: JSON.stringify(extracted.aestheticLabels),
      colorPalette: JSON.stringify(extracted.colorPalette),
      silhouetteNotes: extracted.silhouetteNotes,
      formalityRangeMin: extracted.formalityRangeMin,
      formalityRangeMax: extracted.formalityRangeMax,
      moodDescription: extracted.moodDescription,
    },
  });

  return NextResponse.json(serializeInspirationImage(item), { status: 201 });
}
