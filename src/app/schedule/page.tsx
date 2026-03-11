import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime, PHASE_LABELS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const season = await prisma.season.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      matches: {
        include: { player1: true, player2: true, winner: true, sets: true },
        orderBy: { scheduledAt: "asc" },
      },
    },
  });

  if (!season || season.matches.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">📅 Calendario de Partidos</h1>
        <p className="text-text-muted">No hay partidos programados aún.</p>
      </div>
    );
  }

  // Group matches by date
  const matchesByDate = new Map<string, typeof season.matches>();
  const noDateMatches: typeof season.matches = [];

  for (const match of season.matches) {
    if (match.scheduledAt) {
      const dateKey = new Date(match.scheduledAt).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      if (!matchesByDate.has(dateKey)) matchesByDate.set(dateKey, []);
      matchesByDate.get(dateKey)!.push(match);
    } else {
      noDateMatches.push(match);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">📅 Calendario de Partidos</h1>
      <p className="text-text-muted mb-8">{season.name}</p>

      <div className="space-y-6">
        {Array.from(matchesByDate.entries()).map(([date, matches]) => (
          <div key={date}>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3 capitalize">{date}</h3>
            <div className="space-y-2">
              {matches.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </div>
          </div>
        ))}

        {noDateMatches.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">Sin fecha asignada</h3>
            <div className="space-y-2">
              {noDateMatches.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchRow({ match }: { match: {
  id: string;
  player1: { name: string };
  player2: { name: string };
  status: string;
  phase: string;
  winnerId: string | null;
  player1Id: string;
  player2Id: string;
  scheduledAt: Date | null;
  sets: { player1Score: number; player2Score: number }[];
} }) {
  const isCompleted = match.status === "completed";
  const setsP1 = match.sets.filter((s) => s.player1Score > s.player2Score).length;
  const setsP2 = match.sets.filter((s) => s.player2Score > s.player1Score).length;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block bg-white rounded-lg border border-border p-4 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className={`font-medium truncate ${isCompleted && match.winnerId === match.player1Id ? "text-primary font-bold" : ""}`}>
                {match.player1.name}
              </span>
              <span className="text-text-muted flex-shrink-0">vs</span>
              <span className={`font-medium truncate ${isCompleted && match.winnerId === match.player2Id ? "text-primary font-bold" : ""}`}>
                {match.player2.name}
              </span>
            </div>
            {match.scheduledAt && (
              <span className="text-xs text-text-muted">
                {new Date(match.scheduledAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {match.phase !== "round_robin" && (
            <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full font-medium">
              {PHASE_LABELS[match.phase]}
            </span>
          )}
          {isCompleted ? (
            <span className="text-sm font-bold text-primary">{setsP1}-{setsP2}</span>
          ) : (
            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">Pendiente</span>
          )}
        </div>
      </div>
    </Link>
  );
}
