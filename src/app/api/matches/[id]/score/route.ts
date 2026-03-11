import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { accessCode, sets } = body;

    if (!accessCode || !sets || !Array.isArray(sets)) {
      return NextResponse.json({ error: "Código de acceso y sets son requeridos" }, { status: 400 });
    }

    // Verify match exists and is not completed
    const match = await prisma.match.findUnique({
      where: { id },
      include: { player1: true, player2: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
    }

    if (match.status === "completed") {
      return NextResponse.json({ error: "Este partido ya tiene resultado" }, { status: 400 });
    }

    // Verify access code belongs to one of the players
    const player = await prisma.player.findUnique({ where: { accessCode } });
    if (!player || (player.id !== match.player1Id && player.id !== match.player2Id)) {
      return NextResponse.json({ error: "Código de acceso inválido para este partido" }, { status: 403 });
    }

    // Validate sets
    const isPlayoff = match.phase !== "round_robin";
    const maxSets = isPlayoff ? 5 : 3;
    const setsNeeded = isPlayoff ? 3 : 2; // Best of 5 needs 3 wins, best of 3 needs 2

    if (sets.length < 2 || sets.length > maxSets) {
      return NextResponse.json({ error: `Se requieren entre 2 y ${maxSets} sets` }, { status: 400 });
    }

    let p1Wins = 0;
    let p2Wins = 0;

    for (const set of sets) {
      const s1 = Number(set.player1Score);
      const s2 = Number(set.player2Score);

      if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
        return NextResponse.json({ error: "Marcadores inválidos" }, { status: 400 });
      }

      // Validate ping pong scoring: first to 11, win by 2
      const maxScore = Math.max(s1, s2);
      const minScore = Math.min(s1, s2);

      if (maxScore < 11) {
        return NextResponse.json({ error: `Set ${set.setNumber}: el ganador debe llegar a 11 puntos mínimo` }, { status: 400 });
      }

      if (maxScore - minScore < 2) {
        return NextResponse.json({ error: `Set ${set.setNumber}: debe haber diferencia de al menos 2 puntos` }, { status: 400 });
      }

      if (minScore >= 10 && maxScore !== minScore + 2) {
        return NextResponse.json({ error: `Set ${set.setNumber}: después de 10-10, se gana por diferencia de 2` }, { status: 400 });
      }

      if (minScore < 10 && maxScore !== 11) {
        return NextResponse.json({ error: `Set ${set.setNumber}: si el perdedor tiene menos de 10, el ganador debe tener 11` }, { status: 400 });
      }

      if (s1 > s2) p1Wins++;
      else p2Wins++;
    }

    // Validate someone won the match
    if (p1Wins < setsNeeded && p2Wins < setsNeeded) {
      return NextResponse.json({ error: `Un jugador debe ganar ${setsNeeded} sets (mejor de ${maxSets})` }, { status: 400 });
    }

    const winnerId = p1Wins > p2Wins ? match.player1Id : match.player2Id;

    // Save in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing sets if any
      await tx.set.deleteMany({ where: { matchId: id } });

      // Create new sets
      for (const set of sets) {
        await tx.set.create({
          data: {
            matchId: id,
            setNumber: set.setNumber,
            player1Score: Number(set.player1Score),
            player2Score: Number(set.player2Score),
          },
        });
      }

      // Update match
      await tx.match.update({
        where: { id },
        data: { status: "completed", winnerId },
      });
    });

    return NextResponse.json({ success: true, winnerId });
  } catch (error) {
    console.error("Error saving score:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
