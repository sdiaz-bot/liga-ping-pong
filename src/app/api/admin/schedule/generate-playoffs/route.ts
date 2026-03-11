import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateStandings } from "@/lib/standings-calculator";
import { generatePlayoffBracket } from "@/lib/bracket-generator";

export async function POST() {
  try {
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

    if (!season) {
      return NextResponse.json({ error: "No hay temporada activa" }, { status: 400 });
    }

    // Check if playoff matches already exist
    const existingPlayoffs = await prisma.match.count({
      where: { seasonId: season.id, phase: { not: "round_robin" } },
    });

    if (existingPlayoffs > 0) {
      return NextResponse.json({ error: "Ya existen partidos de playoffs" }, { status: 400 });
    }

    // Calculate standings
    const players = season.players.map((p) => ({ id: p.id, name: p.name, department: p.department }));
    const standings = calculateStandings(players, season.matches, season.playoffSize);

    if (standings.length < season.playoffSize) {
      return NextResponse.json({
        error: `Se necesitan al menos ${season.playoffSize} jugadores para playoffs. Hay ${standings.length}.`,
      }, { status: 400 });
    }

    // Generate bracket
    const playoffSize = season.playoffSize as 8 | 16;
    const bracketMatches = generatePlayoffBracket(standings, playoffSize);

    // Create matches in database
    let created = 0;
    for (const bm of bracketMatches) {
      await prisma.match.create({
        data: {
          seasonId: season.id,
          player1Id: bm.player1Id || season.players[0].id, // placeholder for TBD
          player2Id: bm.player2Id || season.players[1].id, // placeholder for TBD
          phase: bm.phase,
          bracketPosition: bm.bracketPosition,
          status: bm.player1Id && bm.player2Id ? "scheduled" : "scheduled",
        },
      });
      created++;
    }

    return NextResponse.json({ success: true, matchCount: created });
  } catch (error) {
    console.error("Error generating playoffs:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
