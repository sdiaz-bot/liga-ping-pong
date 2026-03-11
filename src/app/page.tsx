import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { calculateStandings } from "@/lib/standings-calculator";
import { STATUS_LABELS, SEASON_COLORS, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getSeasonData() {
  const season = await prisma.season.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      players: { where: { isActive: true } },
      matches: {
        include: { sets: true, player1: true, player2: true, winner: true },
        orderBy: { scheduledAt: "asc" },
      },
    },
  });
  return season;
}

export default async function HomePage() {
  const season = await getSeasonData();

  if (!season) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">🏓 Liga de Ping Pong</h1>
        <p className="text-text-muted text-lg">No hay temporada activa. Próximamente...</p>
      </div>
    );
  }

  const players = season.players.map((p) => ({ id: p.id, name: p.name, department: p.department }));
  const roundRobinMatches = season.matches.filter((m) => m.phase === "round_robin");
  const standings = calculateStandings(players, roundRobinMatches, season.playoffSize);

  const upcomingMatches = season.matches
    .filter((m) => m.status === "scheduled" && m.scheduledAt)
    .slice(0, 5);

  const recentResults = season.matches
    .filter((m) => m.status === "completed")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const totalMatches = roundRobinMatches.length;
  const completedMatches = roundRobinMatches.filter((m) => m.status === "completed").length;
  const progress = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-4">
            🏓 Liga de Ping Pong
          </h1>
          <p className="text-xl sm:text-2xl opacity-90 mb-2">{season.name}</p>
          <span className={`inline-block mt-4 px-4 py-2 rounded-full text-sm font-semibold ${SEASON_COLORS[season.status]} bg-white/20`}>
            {STATUS_LABELS[season.status]}
          </span>
          {season.status === "registration" && (
            <div className="mt-8">
              <Link
                href="/register"
                className="inline-block bg-accent hover:bg-accent-dark text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg"
              >
                ¡Inscríbete Ahora!
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Progress Bar */}
        {totalMatches > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-text-muted uppercase tracking-wide">Progreso de la Temporada</h3>
              <span className="text-sm font-medium">{completedMatches}/{totalMatches} partidos</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary rounded-full h-3 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Jugadores" value={season.players.length} icon="👥" />
          <StatCard label="Partidos Jugados" value={completedMatches} icon="🏓" />
          <StatCard label="Por Jugar" value={totalMatches - completedMatches} icon="📅" />
          <StatCard label="Fase" value={STATUS_LABELS[season.status]} icon="🏆" isText />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Standings Top 10 */}
          <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-lg">🏆 Posiciones</h2>
              <Link href="/standings" className="text-primary text-sm font-medium hover:underline">
                Ver todas →
              </Link>
            </div>
            {standings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-text-muted">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-text-muted">Jugador</th>
                      <th className="px-4 py-3 text-center font-semibold text-text-muted">PJ</th>
                      <th className="px-4 py-3 text-center font-semibold text-text-muted">G</th>
                      <th className="px-4 py-3 text-center font-semibold text-text-muted">P</th>
                      <th className="px-4 py-3 text-center font-semibold text-text-muted">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.slice(0, 10).map((s) => (
                      <tr
                        key={s.playerId}
                        className={`border-t border-border ${s.qualified ? "bg-primary/5" : ""}`}
                      >
                        <td className="px-4 py-3 font-bold text-text-muted">{s.position}</td>
                        <td className="px-4 py-3 font-medium">{s.playerName}</td>
                        <td className="px-4 py-3 text-center">{s.played}</td>
                        <td className="px-4 py-3 text-center text-success font-medium">{s.won}</td>
                        <td className="px-4 py-3 text-center text-danger font-medium">{s.lost}</td>
                        <td className="px-4 py-3 text-center font-bold text-primary">{s.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-6 py-8 text-center text-text-muted">
                La tabla se actualizará cuando inicien los partidos.
              </p>
            )}
          </div>

          {/* Upcoming & Recent */}
          <div className="space-y-8">
            {/* Upcoming Matches */}
            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-bold text-lg">📅 Próximos Partidos</h2>
                <Link href="/schedule" className="text-primary text-sm font-medium hover:underline">
                  Ver calendario →
                </Link>
              </div>
              {upcomingMatches.length > 0 ? (
                <div className="divide-y divide-border">
                  {upcomingMatches.map((m) => (
                    <Link key={m.id} href={`/matches/${m.id}`} className="block px-6 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">
                          {m.player1.name} <span className="text-text-muted">vs</span> {m.player2.name}
                        </div>
                        {m.scheduledAt && (
                          <span className="text-xs text-text-muted">{formatDateTime(m.scheduledAt)}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="px-6 py-8 text-center text-text-muted">No hay partidos programados.</p>
              )}
            </div>

            {/* Recent Results */}
            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-bold text-lg">✅ Resultados Recientes</h2>
              </div>
              {recentResults.length > 0 ? (
                <div className="divide-y divide-border">
                  {recentResults.map((m) => (
                    <Link key={m.id} href={`/matches/${m.id}`} className="block px-6 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className={m.winnerId === m.player1Id ? "font-bold text-primary" : ""}>
                            {m.player1.name}
                          </span>
                          <span className="text-text-muted mx-2">vs</span>
                          <span className={m.winnerId === m.player2Id ? "font-bold text-primary" : ""}>
                            {m.player2.name}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-accent">
                          {m.sets.filter((s) => s.player1Score > s.player2Score).length}-
                          {m.sets.filter((s) => s.player2Score > s.player1Score).length}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="px-6 py-8 text-center text-text-muted">Aún no hay resultados.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, isText }: { label: string; value: string | number; icon: string; isText?: boolean }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-border text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`font-bold ${isText ? "text-sm" : "text-2xl"} text-text`}>{value}</div>
      <div className="text-xs text-text-muted mt-1 uppercase tracking-wide">{label}</div>
    </div>
  );
}
