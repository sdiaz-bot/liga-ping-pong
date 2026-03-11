import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const matches = await prisma.match.findMany({
    include: { player1: true, player2: true, winner: true, sets: true },
    orderBy: { scheduledAt: "asc" },
  });
  return NextResponse.json(matches);
}
