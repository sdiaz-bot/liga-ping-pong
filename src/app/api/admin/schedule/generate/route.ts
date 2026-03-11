import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRoundRobinMatchups, assignMatchesToSlots } from "@/lib/scheduling-engine";

export async function POST() {
  try {
    const season = await prisma.season.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        players: { where: { isActive: true } },
        timeSlots: { where: { isActive: true } },
      },
    });

    if (!season) {
      return NextResponse.json({ error: "No hay temporada activa" }, { status: 400 });
    }

    if (season.players.length < 2) {
      return NextResponse.json({ error: "Se necesitan al menos 2 jugadores" }, { status: 400 });
    }

    // Check if round robin matches already exist
    const existingMatches = await prisma.match.count({
      where: { seasonId: season.id, phase: "round_robin" },
    });

    if (existingMatches > 0) {
      return NextResponse.json({ error: "Ya existen partidos de round robin. Elimínalos primero si quieres regenerar." }, { status: 400 });
    }

    // Generate matchups
    const players = season.players.map((p) => ({ id: p.id, name: p.name }));
    const matchups = generateRoundRobinMatchups(players);

    // Assign to slots
    const slots = season.timeSlots.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
    }));

    const startDate = season.startDate || new Date();
    const scheduled = assignMatchesToSlots(matchups, slots, startDate);

    // Create matches in database
    let created = 0;
    for (const match of scheduled) {
      await prisma.match.create({
        data: {
          seasonId: season.id,
          player1Id: match.player1Id,
          player2Id: match.player2Id,
          scheduledAt: match.scheduledAt,
          phase: "round_robin",
          status: "scheduled",
        },
      });
      created++;
    }

    return NextResponse.json({ success: true, matchCount: created });
  } catch (error) {
    console.error("Error generating schedule:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
