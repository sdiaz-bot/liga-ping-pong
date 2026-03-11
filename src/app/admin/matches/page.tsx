"use client";

import { useState, useEffect } from "react";

interface Match {
  id: string;
  player1: { name: string };
  player2: { name: string };
  status: string;
  phase: string;
  winnerId: string | null;
  player1Id: string;
  player2Id: string;
  sets: { player1Score: number; player2Score: number }[];
}

const PHASE_LABELS: Record<string, string> = {
  round_robin: "Round Robin",
  octavos: "Octavos",
  cuartos: "Cuartos",
  semis: "Semis",
  final: "Final",
  tercer_puesto: "3er Puesto",
};

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    const res = await fetch("/api/matches");
    const data = await res.json();
    setMatches(data);
    setLoading(false);
  }

  async function setForfeit(matchId: string, winnerId: string) {
    const res = await fetch(`/api/admin/matches/${matchId}/forfeit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerId }),
    });
    if (res.ok) {
      setMessage("Forfeit registrado");
      loadMatches();
    } else {
      const data = await res.json();
      setMessage(data.error || "Error");
    }
  }

  async function resetMatch(matchId: string) {
    const res = await fetch(`/api/admin/matches/${matchId}/reset`, { method: "POST" });
    if (res.ok) {
      setMessage("Partido reseteado");
      loadMatches();
    } else {
      const data = await res.json();
      setMessage(data.error || "Error");
    }
  }

  const filtered = matches.filter((m) => {
    if (filter === "all") return true;
    if (filter === "pending") return m.status === "scheduled";
    if (filter === "completed") return m.status === "completed";
    return m.phase === filter;
  });

  if (loading) return <p className="text-text-muted">Cargando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">🏓 Gestión de Partidos</h2>
        <span className="text-sm text-text-muted">{matches.length} partidos total</span>
      </div>

      {message && (
        <div className="bg-primary/10 text-primary rounded-lg p-3 text-sm">{message}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "Todos" },
          { key: "pending", label: "Pendientes" },
          { key: "completed", label: "Completados" },
          { key: "round_robin", label: "Round Robin" },
          { key: "octavos", label: "Octavos" },
          { key: "cuartos", label: "Cuartos" },
          { key: "semis", label: "Semis" },
          { key: "final", label: "Final" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === f.key ? "bg-primary text-white" : "bg-gray-100 text-text-muted hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Match List */}
      <div className="space-y-2">
        {filtered.map((m) => {
          const setsP1 = m.sets.filter((s) => s.player1Score > s.player2Score).length;
          const setsP2 = m.sets.filter((s) => s.player2Score > s.player1Score).length;

          return (
            <div key={m.id} className="bg-white rounded-lg border border-border p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className={m.winnerId === m.player1Id ? "font-bold text-primary" : ""}>
                      {m.player1.name}
                    </span>
                    <span className="text-text-muted mx-2">vs</span>
                    <span className={m.winnerId === m.player2Id ? "font-bold text-primary" : ""}>
                      {m.player2.name}
                    </span>
                    {m.status === "completed" && (
                      <span className="ml-2 text-xs font-bold text-accent">{setsP1}-{setsP2}</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{PHASE_LABELS[m.phase]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      m.status === "completed" ? "bg-success/10 text-success" :
                      m.status === "forfeited" ? "bg-danger/10 text-danger" :
                      "bg-blue-50 text-blue-600"
                    }`}>
                      {m.status === "completed" ? "Completado" : m.status === "forfeited" ? "Forfeit" : "Pendiente"}
                    </span>
                  </div>
                </div>
                {m.status === "scheduled" && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => setForfeit(m.id, m.player1Id)}
                      className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                      title={`Forfeit: gana ${m.player1.name}`}
                    >
                      Gana J1
                    </button>
                    <button
                      onClick={() => setForfeit(m.id, m.player2Id)}
                      className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                      title={`Forfeit: gana ${m.player2.name}`}
                    >
                      Gana J2
                    </button>
                  </div>
                )}
                {m.status === "completed" && (
                  <button
                    onClick={() => resetMatch(m.id)}
                    className="text-xs px-2 py-1 rounded bg-danger/10 text-danger hover:bg-danger/20 flex-shrink-0"
                  >
                    Resetear
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-text-muted py-8">No hay partidos con este filtro.</p>
        )}
      </div>
    </div>
  );
}
