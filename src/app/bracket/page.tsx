import { prisma } from "@/lib/prisma";
import { PHASE_LABELS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BracketPage() {
  const season = await prisma.season.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      matches: {
        where: { phase: { not: "round_robin" } },
        include: { player1: true, player2: true, winner: true, sets: true },
        orderBy: [{ phase: "asc" }, { bracketPosition: "asc" }],
      },
    },
  });

  const playoffMatches = season?.matches || [];

  if (playoffMatches.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">🏆 Bracket de Playoffs</h1>
        <p className="text-text-muted">Los playoffs aún no han comenzado.</p>
        <p className="text-sm text-text-muted mt-2">
          El bracket se generará cuando finalice la fase de Round Robin.
        </p>
      </div>
    );
  }

  // Group by phase
  const phases = ["octavos", "cuartos", "semis", "final", "tercer_puesto"];
  const matchesByPhase = new Map<string, typeof playoffMatches>();
  for (const phase of phases) {
    const phaseMatches = playoffMatches.filter((m) => m.phase === phase);
    if (phaseMatches.length > 0) {
      matchesByPhase.set(phase, phaseMatches);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">🏆 Bracket de Playoffs</h1>
      <p className="text-text-muted mb-8">{season?.name}</p>

      <div className="flex gap-8 overflow-x-auto pb-4">
        {Array.from(matchesByPhase.entries()).map(([phase, matches]) => (
          <div key={phase} className="flex-shrink-0" style={{ minWidth: "220px" }}>
            <h3 className="text-sm font-bold text-center text-text-muted uppercase tracking-wide mb-4">
              {PHASE_LABELS[phase]}
            </h3>
            <div className="space-y-4 flex flex-col justify-around h-full">
              {matches.map((m) => (
                <BracketMatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketMatchCard({ match }: { match: {
  id: string;
  player1: { name: string } | null;
  player2: { name: string } | null;
  player1Id: string;
  player2Id: string;
  winnerId: string | null;
  status: string;
  sets: { player1Score: number; player2Score: number }[];
} }) {
  const isCompleted = match.status === "completed";
  const setsP1 = match.sets.filter((s) => s.player1Score > s.player2Score).length;
  const setsP2 = match.sets.filter((s) => s.player2Score > s.player1Score).length;

  return (
    <div className="bg-white rounded-lg border-2 border-border shadow-sm overflow-hidden">
      <div className={`px-3 py-2 flex items-center justify-between border-b border-border ${
        isCompleted && match.winnerId === match.player1Id ? "bg-primary/10" : ""
      }`}>
        <span className={`text-sm truncate ${
          isCompleted && match.winnerId === match.player1Id ? "font-bold text-primary" : ""
        }`}>
          {match.player1?.name || "Por definir"}
        </span>
        {isCompleted && <span className="text-sm font-bold ml-2">{setsP1}</span>}
      </div>
      <div className={`px-3 py-2 flex items-center justify-between ${
        isCompleted && match.winnerId === match.player2Id ? "bg-primary/10" : ""
      }`}>
        <span className={`text-sm truncate ${
          isCompleted && match.winnerId === match.player2Id ? "font-bold text-primary" : ""
        }`}>
          {match.player2?.name || "Por definir"}
        </span>
        {isCompleted && <span className="text-sm font-bold ml-2">{setsP2}</span>}
      </div>
    </div>
  );
}
