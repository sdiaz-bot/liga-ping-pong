import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateStandings } from "@/lib/standings-calculator";

export async function GET() {
  const season = await prisma.season.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      players: { where: { isActive: true } },
      matches: {
        where: { phase: "round_robin" },
        include: { sets: true },
      },
    },
  });

  if (!season) return NextResponse.json({ standings: [], season: null });

  const players = season.players.map((p) => ({ id: p.id, name: p.name, department: p.department }));
  const standings = calculateStandings(players, season.matches, season.playoffSize);

  return NextResponse.json({ standings, season: { id: season.id, name: season.name, status: season.status, playoffSize: season.playoffSize } });
}
