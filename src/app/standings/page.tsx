import { prisma } from "@/lib/prisma";
import { calculateStandings } from "@/lib/standings-calculator";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
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
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">🏆 Tabla de Posiciones</h1>
        <p className="text-text-muted">No hay temporada activa.</p>
      </div>
    );
  }

  const players = season.players.map((p) => ({ id: p.id, name: p.name, department: p.department }));
  const standings = calculateStandings(players, season.matches, season.playoffSize);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">🏆 Tabla de Posiciones</h1>
      <p className="text-text-muted mb-8">{season.name} — Fase Round Robin</p>

      {standings.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border border-border text-center text-text-muted">
          La tabla se actualizará cuando inicien los partidos.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-text-muted">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-muted">Jugador</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-muted hidden sm:table-cell">Depto</th>
                  <th className="px-4 py-3 text-center font-semibold text-text-muted">PJ</th>
                  <th className="px-4 py-3 text-center font-semibold text-text-muted">G</th>
                  <th className="px-4 py-3 text-center font-semibold text-text-muted">P</th>
                  <th className="px-4 py-3 text-center font-semibold text-text-muted hidden sm:table-cell">Sets +/-</th>
                  <th className="px-4 py-3 text-center font-semibold text-text-muted hidden sm:table-cell">Pts +/-</th>
                  <th className="px-4 py-3 text-center font-semibold text-text-muted">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s) => (
                  <tr
                    key={s.playerId}
                    className={`border-t border-border transition-colors hover:bg-gray-50 ${
                      s.qualified ? "bg-primary/5 border-l-4 border-l-primary" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        s.position <= 3 ? "bg-accent text-white" : "bg-gray-100 text-text-muted"
                      }`}>
                        {s.position}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{s.playerName}</td>
                    <td className="px-4 py-3 text-text-muted hidden sm:table-cell">{s.department}</td>
                    <td className="px-4 py-3 text-center">{s.played}</td>
                    <td className="px-4 py-3 text-center text-success font-medium">{s.won}</td>
                    <td className="px-4 py-3 text-center text-danger font-medium">{s.lost}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className={s.setDiff > 0 ? "text-success" : s.setDiff < 0 ? "text-danger" : ""}>
                        {s.setDiff > 0 ? "+" : ""}{s.setDiff}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className={s.pointDiff > 0 ? "text-success" : s.pointDiff < 0 ? "text-danger" : ""}>
                        {s.pointDiff > 0 ? "+" : ""}{s.pointDiff}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-primary text-lg">{s.points}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-border text-xs text-text-muted">
            <span className="inline-block w-3 h-3 bg-primary/20 border-l-4 border-primary mr-1"></span>
            Zona de clasificación a playoffs (Top {season.playoffSize})
          </div>
        </div>
      )}
    </div>
  );
}
