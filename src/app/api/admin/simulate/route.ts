import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateRoundRobinMatchups } from "@/lib/scheduling-engine";
import { calculateStandings } from "@/lib/standings-calculator";
import { generatePlayoffBracket, getNextPhase, getNextBracketPosition } from "@/lib/bracket-generator";
import { generateAccessCode } from "@/lib/utils";

const PLAYERS_DATA = [
  { name: "Carlos García", department: "Ingenieria", skillLevel: "avanzado" },
  { name: "Ana López", department: "Ingenieria", skillLevel: "intermedio" },
  { name: "Miguel Torres", department: "Ingenieria", skillLevel: "avanzado" },
  { name: "Sofía Hernández", department: "Ingenieria", skillLevel: "principiante" },
  { name: "Diego Martín", department: "Ingenieria", skillLevel: "intermedio" },
  { name: "Valentina Ruiz", department: "Ingenieria", skillLevel: "avanzado" },
  { name: "Lucía Sánchez", department: "Marketing", skillLevel: "intermedio" },
  { name: "Andrés Pérez", department: "Marketing", skillLevel: "principiante" },
  { name: "Camila Flores", department: "Marketing", skillLevel: "avanzado" },
  { name: "Felipe Gómez", department: "Marketing", skillLevel: "intermedio" },
  { name: "Isabella Castro", department: "Marketing", skillLevel: "principiante" },
  { name: "Sebastián Morales", department: "Ventas", skillLevel: "avanzado" },
  { name: "Daniela Jiménez", department: "Ventas", skillLevel: "intermedio" },
  { name: "Mateo Vargas", department: "Ventas", skillLevel: "principiante" },
  { name: "Paula Ramos", department: "Ventas", skillLevel: "avanzado" },
  { name: "Alejandro Díaz", department: "Ventas", skillLevel: "intermedio" },
  { name: "Natalia Gutiérrez", department: "RRHH", skillLevel: "principiante" },
  { name: "Roberto Álvarez", department: "RRHH", skillLevel: "intermedio" },
  { name: "Gabriela Muñoz", department: "RRHH", skillLevel: "avanzado" },
  { name: "Emilio Reyes", department: "RRHH", skillLevel: "principiante" },
  { name: "Fernanda Cruz", department: "Finanzas", skillLevel: "intermedio" },
  { name: "Tomás Medina", department: "Finanzas", skillLevel: "avanzado" },
  { name: "Renata Ortiz", department: "Finanzas", skillLevel: "principiante" },
  { name: "Hugo Mendoza", department: "Finanzas", skillLevel: "intermedio" },
  { name: "Lorena Aguilar", department: "Operaciones", skillLevel: "avanzado" },
  { name: "Cristian Vega", department: "Operaciones", skillLevel: "intermedio" },
  { name: "Mariana Herrera", department: "Operaciones", skillLevel: "principiante" },
  { name: "Javier Romero", department: "Operaciones", skillLevel: "avanzado" },
];

function randomSet(p1Wins: boolean): { player1Score: number; player2Score: number } {
  if (Math.random() < 0.2) {
    const base = 10 + Math.floor(Math.random() * 4);
    return p1Wins
      ? { player1Score: base + 2, player2Score: base }
      : { player1Score: base, player2Score: base + 2 };
  }
  const loserScore = Math.floor(Math.random() * 10);
  return p1Wins
    ? { player1Score: 11, player2Score: loserScore }
    : { player1Score: loserScore, player2Score: 11 };
}

function simulateSets(isPlayoff: boolean) {
  const setsNeeded = isPlayoff ? 3 : 2;
  const maxSets = isPlayoff ? 5 : 3;
  const p1WinsMatch = Math.random() < 0.5;
  const sets: { setNumber: number; player1Score: number; player2Score: number }[] = [];
  let p1Wins = 0, p2Wins = 0, setNum = 1;
  while (p1Wins < setsNeeded && p2Wins < setsNeeded && setNum <= maxSets) {
    const p1WinsSet = Math.random() < (p1WinsMatch ? 0.6 : 0.4);
    const scores = randomSet(p1WinsSet);
    sets.push({ setNumber: setNum++, ...scores });
    if (p1WinsSet) p1Wins++; else p2Wins++;
  }
  return { sets, winnerSlot: p1Wins > p2Wins ? "player1" : "player2" as "player1" | "player2" };
}

function generateUniqueCodes(count: number): string[] {
  const codes = new Set<string>();
  while (codes.size < count) codes.add(generateAccessCode());
  return [...codes];
}

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const log: string[] = [];
  const startTime = Date.now();

  try {
    // 1. Create season
    const season = await prisma.season.create({
      data: {
        name: `Simulacion ${new Date().toLocaleDateString("es-CL")} ${new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}`,
        playoffSize: 16,
        status: "registration",
      },
    });
    log.push(`Temporada creada: "${season.name}"`);

    // 2. Create 28 players with unique codes and emails
    const ts = Date.now();
    const codes = generateUniqueCodes(28);
    const playersData = PLAYERS_DATA.map((p, i) => ({
      name: p.name,
      email: `sim${ts}_${i}@test.com`,
      department: p.department,
      skillLevel: p.skillLevel,
      accessCode: codes[i],
      seasonId: season.id,
      isActive: true,
    }));
    await prisma.player.createMany({ data: playersData });
    const players = await prisma.player.findMany({ where: { seasonId: season.id } });
    log.push(`${players.length} jugadores registrados`);

    // 3. Advance to round_robin and generate matches
    await prisma.season.update({
      where: { id: season.id },
      data: { status: "round_robin", startDate: new Date() },
    });

    const matchups = generateRoundRobinMatchups(players);
    await prisma.match.createMany({
      data: matchups.map((m) => ({
        seasonId: season.id,
        player1Id: m.player1Id,
        player2Id: m.player2Id,
        phase: "round_robin",
        status: "scheduled",
      })),
    });
    const rrMatches = await prisma.match.findMany({
      where: { seasonId: season.id, phase: "round_robin" },
    });
    log.push(`${rrMatches.length} partidos de round-robin generados (${players.length}×${players.length - 1}/2)`);

    // 4. Simulate all round-robin matches
    const allSets: { matchId: string; setNumber: number; player1Score: number; player2Score: number }[] = [];
    const matchUpdates: { id: string; winnerId: string }[] = [];

    for (const match of rrMatches) {
      const { sets, winnerSlot } = simulateSets(false);
      const winnerId = winnerSlot === "player1" ? match.player1Id : match.player2Id;
      sets.forEach((s) => allSets.push({ matchId: match.id, ...s }));
      matchUpdates.push({ id: match.id, winnerId });
    }

    await prisma.set.createMany({ data: allSets });
    await prisma.$transaction(
      matchUpdates.map((m) =>
        prisma.match.update({ where: { id: m.id }, data: { status: "completed", winnerId: m.winnerId } })
      )
    );
    log.push(`${rrMatches.length} partidos simulados (${allSets.length} sets en total)`);

    // 5. Advance to playoffs and generate bracket
    await prisma.season.update({ where: { id: season.id }, data: { status: "playoffs" } });

    const seasonWithData = await prisma.season.findUnique({
      where: { id: season.id },
      include: {
        players: { where: { isActive: true } },
        matches: { where: { phase: "round_robin" }, include: { sets: true } },
      },
    });
    const standingsInput = seasonWithData!.players.map((p) => ({ id: p.id, name: p.name, department: p.department }));
    const standings = calculateStandings(standingsInput, seasonWithData!.matches, 16);

    const bracketMatches = generatePlayoffBracket(standings, 16);
    for (const bm of bracketMatches) {
      await prisma.match.create({
        data: {
          seasonId: season.id,
          player1Id: bm.player1Id ?? players[0].id,
          player2Id: bm.player2Id ?? players[1].id,
          phase: bm.phase,
          bracketPosition: bm.bracketPosition,
          status: "scheduled",
        },
      });
    }
    log.push(`Bracket generado (top 16 clasificados)`);

    // 6. Simulate playoffs phase by phase
    const phases = ["octavos", "cuartos", "semis", "final", "tercer_puesto"];
    let totalPlayoff = 0;

    for (const phase of phases) {
      const phaseMatches = await prisma.match.findMany({
        where: { seasonId: season.id, phase, status: "scheduled" },
      });

      for (const match of phaseMatches) {
        const { sets, winnerSlot } = simulateSets(true);
        const winnerId = winnerSlot === "player1" ? match.player1Id : match.player2Id;
        const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;

        await prisma.set.createMany({ data: sets.map((s) => ({ matchId: match.id, ...s })) });
        await prisma.match.update({ where: { id: match.id }, data: { status: "completed", winnerId } });

        // Advance winner to next phase
        if (match.bracketPosition !== null) {
          const nextPhase = getNextPhase(phase);
          if (nextPhase) {
            const { position: nextPos, slot } = getNextBracketPosition(phase, match.bracketPosition);
            const nextMatch = await prisma.match.findFirst({
              where: { seasonId: season.id, phase: nextPhase, bracketPosition: nextPos },
            });
            if (nextMatch) {
              await prisma.match.update({
                where: { id: nextMatch.id },
                data: { [slot === "player1" ? "player1Id" : "player2Id"]: winnerId },
              });
            }
          }

          // Semis loser to tercer_puesto
          if (phase === "semis") {
            const tercerPuesto = await prisma.match.findFirst({
              where: { seasonId: season.id, phase: "tercer_puesto" },
            });
            if (tercerPuesto && loserId) {
              const slotField = match.bracketPosition === 1 ? "player1Id" : "player2Id";
              await prisma.match.update({ where: { id: tercerPuesto.id }, data: { [slotField]: loserId } });
            }
          }
        }

        totalPlayoff++;
      }

      if (phaseMatches.length > 0) log.push(`  ${phase}: ${phaseMatches.length} partidos completados`);
    }
    log.push(`Playoffs completados (${totalPlayoff} partidos)`);

    // 7. Get champion and complete season
    const finalMatch = await prisma.match.findFirst({
      where: { seasonId: season.id, phase: "final", status: "completed" },
      include: { winner: true },
    });
    await prisma.season.update({ where: { id: season.id }, data: { status: "completed", endDate: new Date() } });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log.push(`Temporada completada en ${elapsed}s`);

    return NextResponse.json({
      success: true,
      champion: finalMatch?.winner?.name ?? "Desconocido",
      seasonId: season.id,
      totalMatches: rrMatches.length + totalPlayoff,
      log,
      elapsed: `${elapsed}s`,
    });
  } catch (error) {
    console.error("Simulation error:", error);
    return NextResponse.json({ error: String(error), log }, { status: 500 });
  }
}
