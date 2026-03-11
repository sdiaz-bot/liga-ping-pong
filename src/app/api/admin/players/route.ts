import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAccessCode } from "@/lib/utils";

export async function GET() {
  const season = await prisma.season.findFirst({ orderBy: { createdAt: "desc" } });
  const players = await prisma.player.findMany({
    where: season ? { seasonId: season.id } : {},
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ players });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, isActive, regenerateCode } = body;

  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof isActive === "boolean") data.isActive = isActive;
  if (regenerateCode) data.accessCode = generateAccessCode();

  const player = await prisma.player.update({ where: { id }, data });
  return NextResponse.json({ player });
}
