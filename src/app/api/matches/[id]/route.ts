import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    include: { player1: true, player2: true, winner: true, sets: { orderBy: { setNumber: "asc" } } },
  });
  if (!match) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  return NextResponse.json(match);
}
