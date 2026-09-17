import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeStyleProfile } from "@/lib/styleProfile";

export async function GET() {
  const profile = await prisma.styleProfile.findUnique({ where: { id: "singleton" } });
  return NextResponse.json(profile ? serializeStyleProfile(profile) : null);
}
