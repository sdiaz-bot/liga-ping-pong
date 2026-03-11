import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });

  await prisma.$transaction([
    prisma.set.deleteMany({ where: { matchId: id } }),
    prisma.match.update({
      where: { id },
      data: { status: "scheduled", winnerId: null },
    }),
  ]);

  return NextResponse.json({ success: true });
}
