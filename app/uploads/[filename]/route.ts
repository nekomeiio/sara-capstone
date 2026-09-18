import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

// Serves files from public/uploads/ via a route handler instead of Next's
// static /public serving. Next 16's Turbopack dev server has a bug where it
// fails to serve any file in a subdirectory of /public (top-level files
// serve fine) — this sidesteps that entirely, since it never goes through
// Turbopack's static-asset pipeline.
const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  if (filename.includes("/") || filename.includes("..")) {
    return NextResponse.json({ error: "Invalid filename." }, { status: 400 });
  }

  const contentType = CONTENT_TYPE_BY_EXTENSION[path.extname(filename).toLowerCase()];
  if (!contentType) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }

  try {
    const data = await readFile(path.join(process.cwd(), "public", "uploads", filename));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
