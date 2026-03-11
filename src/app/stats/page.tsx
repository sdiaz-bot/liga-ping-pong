import { prisma } from "@/lib/prisma";
import { calculateStandings } from "@/lib/standings-calculator";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const season = await prisma.season.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      players: { where: { isActive: true } },
      matches: {
        where: { status: "completed" },
        include: { player1: true, player2: true, sets: true },
      },
    },
  });

  if (!season || season.matches.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">📊 Estadísticas</h1>
        <p className="text-text-muted">Las estadísticas estarán disponibles cuando se jueguen partidos.</p>
      </div>
    );
  }

  const players = season.players.map((p) => ({ id: p.id, name: p.name, department: p.department }));
  const standings = calculateStandings(players, season.matches, season.playoffSize);

  // Calculate extra stats
  const totalMatches = season.matches.length;
  const totalSets = season.matches.reduce((acc, m) => acc + m.sets.length, 0);
  const totalPoints = season.matches.reduce(
    (acc, m) => acc + m.sets.reduce((a, s) => a + s.player1Score + s.player2Score, 0),
    0
  );

  // Best win rate (min 3 matches)
  const qualifiedPlayers = standings.filter((s) => s.played >= 3);
  const bestWinRate = qualifiedPlayers.length > 0
    ? qualifiedPlayers.reduce((best, s) => (s.won / s.played > best.won / best.played ? s : best))
    : null;

  // Most points scored
  const topScorer = standings.length > 0
    ? standings.reduce((best, s) => (s.pointsScored > best.pointsScored ? s : best))
    : null;

  // Best set difference
  const bestSetDiff = standings.length > 0
    ? standings.reduce((best, s) => (s.setDiff > best.setDiff ? s : best))
    : null;

  // Most matches played
  const ironMan = standings.length > 0
    ? standings.reduce((best, s) => (s.played > best.played ? s : best))
    : null;

  // Department stats
  const deptStats = new Map<string, { wins: number; losses: number; players: number }>();
  for (const s of standings) {
    const dept = deptStats.get(s.department) || { wins: 0, losses: 0, players: 0 };
    dept.wins += s.won;
    dept.losses += s.lost;
    dept.players += 1;
    deptStats.set(s.department, dept);
  }

  // Close matches (decided by 2 points in final set)
  const closeMatches = season.matches.filter((m) => {
    const lastSet = m.sets[m.sets.length - 1];
    return lastSet && Math.abs(lastSet.player1Score - lastSet.player2Score) === 2 && Math.min(lastSet.player1Score, lastSet.player2Score) >= 10;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">📊 Estadísticas</h1>
      <p className="text-text-muted mb-8">{season.name}</p>

      {/* Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatBox label="Partidos Jugados" value={totalMatches} />
        <StatBox label="Sets Jugados" value={totalSets} />
        <StatBox label="Puntos Totales" value={totalPoints} />
        <StatBox label="Partidos Reñidos" value={closeMatches.length} />
      </div>

      {/* Awards */}
      <h2 className="text-xl font-bold mb-4">🏅 Destacados</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {bestWinRate && (
          <AwardCard
            title="Mejor Porcentaje"
            player={bestWinRate.playerName}
            stat={`${Math.round((bestWinRate.won / bestWinRate.played) * 100)}% (${bestWinRate.won}G-${bestWinRate.lost}P)`}
            icon="🔥"
          />
        )}
        {topScorer && (
          <AwardCard
            title="Más Puntos Anotados"
            player={topScorer.playerName}
            stat={`${topScorer.pointsScored} puntos`}
            icon="🎯"
          />
        )}
        {bestSetDiff && (
          <AwardCard
            title="Mejor Diferencia Sets"
            player={bestSetDiff.playerName}
            stat={`+${bestSetDiff.setDiff}`}
            icon="💪"
          />
        )}
        {ironMan && (
          <AwardCard
            title="Iron Man"
            player={ironMan.playerName}
            stat={`${ironMan.played} partidos`}
            icon="🦾"
          />
        )}
      </div>

      {/* Department Rankings */}
      <h2 className="text-xl font-bold mb-4">🏢 Ranking por Departamento</h2>
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-text-muted">Departamento</th>
              <th className="px-4 py-3 text-center font-semibold text-text-muted">Jugadores</th>
              <th className="px-4 py-3 text-center font-semibold text-text-muted">Victorias</th>
              <th className="px-4 py-3 text-center font-semibold text-text-muted">Derrotas</th>
              <th className="px-4 py-3 text-center font-semibold text-text-muted">% Victoria</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(deptStats.entries())
              .sort((a, b) => {
                const rateA = a[1].wins / (a[1].wins + a[1].losses || 1);
                const rateB = b[1].wins / (b[1].wins + b[1].losses || 1);
                return rateB - rateA;
              })
              .map(([dept, stats]) => (
                <tr key={dept} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{dept}</td>
                  <td className="px-4 py-3 text-center">{stats.players}</td>
                  <td className="px-4 py-3 text-center text-success">{stats.wins}</td>
                  <td className="px-4 py-3 text-center text-danger">{stats.losses}</td>
                  <td className="px-4 py-3 text-center font-medium">
                    {stats.wins + stats.losses > 0
                      ? `${Math.round((stats.wins / (stats.wins + stats.losses)) * 100)}%`
                      : "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Player Stats Table */}
      <h2 className="text-xl font-bold mb-4">📋 Estadísticas Completas por Jugador</h2>
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-text-muted">Jugador</th>
                <th className="px-4 py-3 text-center font-semibold text-text-muted">PJ</th>
                <th className="px-4 py-3 text-center font-semibold text-text-muted">G</th>
                <th className="px-4 py-3 text-center font-semibold text-text-muted">P</th>
                <th className="px-4 py-3 text-center font-semibold text-text-muted">%G</th>
                <th className="px-4 py-3 text-center font-semibold text-text-muted">SG</th>
                <th className="px-4 py-3 text-center font-semibold text-text-muted">SP</th>
                <th className="px-4 py-3 text-center font-semibold text-text-muted">PA</th>
                <th className="px-4 py-3 text-center font-semibold text-text-muted">PR</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s) => (
                <tr key={s.playerId} className="border-t border-border hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.playerName}</td>
                  <td className="px-4 py-3 text-center">{s.played}</td>
                  <td className="px-4 py-3 text-center text-success">{s.won}</td>
                  <td className="px-4 py-3 text-center text-danger">{s.lost}</td>
                  <td className="px-4 py-3 text-center font-medium">
                    {s.played > 0 ? `${Math.round((s.won / s.played) * 100)}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">{s.setsWon}</td>
                  <td className="px-4 py-3 text-center">{s.setsLost}</td>
                  <td className="px-4 py-3 text-center">{s.pointsScored}</td>
                  <td className="px-4 py-3 text-center">{s.pointsConceded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 bg-gray-50 border-t border-border text-xs text-text-muted">
          PJ=Partidos Jugados, G=Ganados, P=Perdidos, %G=%Victoria, SG=Sets Ganados, SP=Sets Perdidos, PA=Puntos Anotados, PR=Puntos Recibidos
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-border text-center">
      <div className="text-3xl font-bold text-primary">{value}</div>
      <div className="text-xs text-text-muted mt-1 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function AwardCard({ title, player, stat, icon }: { title: string; player: string; stat: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xs text-text-muted uppercase tracking-wide">{title}</div>
      <div className="font-bold text-lg mt-1">{player}</div>
      <div className="text-sm text-primary font-medium">{stat}</div>
    </div>
  );
}
