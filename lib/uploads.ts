import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isSupportedImageMimeType(mimeType: string): boolean {
  return mimeType in EXTENSION_BY_MIME_TYPE;
}

export async function saveUploadedImage(file: File) {
  if (!isSupportedImageMimeType(file.type)) {
    throw new Error("Unsupported image type. Please upload a JPEG, PNG, or WebP image.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = EXTENSION_BY_MIME_TYPE[file.type];
  const filename = `${randomUUID()}.${extension}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return {
    imageUrl: `/uploads/${filename}`,
    buffer,
    mimeType: file.type,
  };
}

export async function deleteUploadedImage(imageUrl: string) {
  if (!imageUrl.startsWith("/uploads/")) return;
  const filePath = path.join(process.cwd(), "public", imageUrl);
  await rm(filePath, { force: true });
}
