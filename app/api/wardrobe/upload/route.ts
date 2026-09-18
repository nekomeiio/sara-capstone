import { NextResponse } from "next/server";
import { tagWardrobeItemImage } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { deleteUploadedImage, saveUploadedImage } from "@/lib/uploads";
import { serializeWardrobeItem } from "@/lib/wardrobe";

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

  let saved: Awaited<ReturnType<typeof saveUploadedImage>>;
  try {
    saved = await saveUploadedImage(file);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't save image." },
      { status: 400 },
    );
  }

  let tags;
  try {
    tags = await tagWardrobeItemImage(saved.buffer.toString("base64"), saved.mimeType);
  } catch {
    await deleteUploadedImage(saved.imageUrl);
    return NextResponse.json(
      { error: "Couldn't analyze this image. Please try again." },
      { status: 502 },
    );
  }

  if (!tags.is_clothing_item) {
    await deleteUploadedImage(saved.imageUrl);
    return NextResponse.json(
      { error: "That doesn't look like a clothing item. Try a different photo." },
      { status: 422 },
    );
  }

  const item = await prisma.wardrobeItem.create({
    data: {
      imageUrl: saved.imageUrl,
      category: tags.category,
      subcategory: tags.subcategory,
      primaryColor: tags.primaryColor,
      secondaryColors: JSON.stringify(tags.secondaryColors),
      pattern: tags.pattern,
      materialGuess: tags.materialGuess,
      formality: tags.formality,
      seasons: JSON.stringify(tags.seasons),
      fitStyle: tags.fitStyle,
      tags: JSON.stringify(tags.tags),
    },
  });

  return NextResponse.json(serializeWardrobeItem(item), { status: 201 });
}
