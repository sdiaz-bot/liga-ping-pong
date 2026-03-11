import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PHASE_LABELS, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    include: { player1: true, player2: true, winner: true, sets: { orderBy: { setNumber: "asc" } } },
  });

  if (!match) notFound();

  const isCompleted = match.status === "completed";
  const setsP1 = match.sets.filter((s) => s.player1Score > s.player2Score).length;
  const setsP2 = match.sets.filter((s) => s.player2Score > s.player1Score).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6 text-center">
          <span className="text-xs uppercase tracking-wider opacity-80">{PHASE_LABELS[match.phase]}</span>
          {match.scheduledAt && (
            <p className="text-sm opacity-80 mt-1">{formatDateTime(match.scheduledAt)}</p>
          )}
        </div>

        {/* Score */}
        <div className="p-8">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center flex-1">
              <p className={`text-lg font-bold ${match.winnerId === match.player1Id ? "text-primary" : ""}`}>
                {match.player1.name}
              </p>
              <p className="text-xs text-text-muted">{match.player1.department}</p>
              {isCompleted && (
                <p className="text-4xl font-extrabold mt-2">{setsP1}</p>
              )}
            </div>
            <div className="text-2xl font-bold text-text-muted">VS</div>
            <div className="text-center flex-1">
              <p className={`text-lg font-bold ${match.winnerId === match.player2Id ? "text-primary" : ""}`}>
                {match.player2.name}
              </p>
              <p className="text-xs text-text-muted">{match.player2.department}</p>
              {isCompleted && (
                <p className="text-4xl font-extrabold mt-2">{setsP2}</p>
              )}
            </div>
          </div>

          {/* Sets detail */}
          {match.sets.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3 text-center">Detalle por Set</h3>
              <div className="space-y-2">
                {match.sets.map((s) => (
                  <div key={s.id} className="flex items-center justify-center gap-4 text-sm">
                    <span className={`w-8 text-right font-bold ${s.player1Score > s.player2Score ? "text-primary" : "text-text-muted"}`}>
                      {s.player1Score}
                    </span>
                    <span className="text-xs text-text-muted px-2 py-1 bg-gray-100 rounded">Set {s.setNumber}</span>
                    <span className={`w-8 text-left font-bold ${s.player2Score > s.player1Score ? "text-primary" : "text-text-muted"}`}>
                      {s.player2Score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Winner badge */}
          {match.winner && (
            <div className="mt-6 text-center">
              <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                🏆 Ganador: {match.winner.name}
              </span>
            </div>
          )}

          {/* Score entry link */}
          {!isCompleted && match.status !== "forfeited" && (
            <div className="mt-8 text-center">
              <Link
                href={`/matches/${match.id}/score`}
                className="inline-block bg-accent hover:bg-accent-dark text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Registrar Marcador
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
