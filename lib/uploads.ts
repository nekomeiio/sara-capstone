const SUPPORTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isSupportedImageMimeType(mimeType: string): boolean {
  return SUPPORTED_MIME_TYPES.has(mimeType);
}

export async function readUploadedImage(file: File) {
  if (!isSupportedImageMimeType(file.type)) {
    throw new Error("Unsupported image type. Please upload a JPEG, PNG, or WebP image.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  return {
    buffer,
    mimeType: file.type,
  };
}
