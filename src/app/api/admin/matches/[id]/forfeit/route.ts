import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { winnerId } = await req.json();

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });

  if (match.status !== "scheduled") {
    return NextResponse.json({ error: "Solo se puede forfeitear un partido pendiente" }, { status: 400 });
  }

  await prisma.match.update({
    where: { id },
    data: { status: "forfeited", winnerId },
  });

  return NextResponse.json({ success: true });
}
