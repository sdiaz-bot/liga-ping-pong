"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

interface MatchData {
  id: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  phase: string;
  status: string;
}

export default function ScoreEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [sets, setSets] = useState<{ p1: string; p2: string }[]>([
    { p1: "", p2: "" },
    { p1: "", p2: "" },
    { p1: "", p2: "" },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isPlayoff = match?.phase !== "round_robin";
  const maxSets = isPlayoff ? 5 : 3;

  useEffect(() => {
    fetch(`/api/matches/${id}`)
      .then((r) => r.json())
      .then(setMatch)
      .catch(() => setError("Error cargando partido"));
  }, [id]);

  function addSet() {
    if (sets.length < maxSets) {
      setSets([...sets, { p1: "", p2: "" }]);
    }
  }

  function removeSet() {
    if (sets.length > 2) {
      setSets(sets.slice(0, -1));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const setsData = sets
      .filter((s) => s.p1 !== "" && s.p2 !== "")
      .map((s, i) => ({
        setNumber: i + 1,
        player1Score: parseInt(s.p1),
        player2Score: parseInt(s.p2),
      }));

    if (setsData.length < 2) {
      setError("Debes registrar al menos 2 sets.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/matches/${id}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode, sets: setsData }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/matches/${id}`);
      } else {
        setError(data.error || "Error al registrar marcador");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  if (!match) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-text-muted">Cargando...</div>
    );
  }

  if (match.status === "completed") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-text-muted">Este partido ya tiene marcador registrado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="bg-white rounded-xl p-8 shadow-sm border border-border">
        <h1 className="text-xl font-bold text-center mb-2">🏓 Registrar Marcador</h1>
        <p className="text-center text-sm text-text-muted mb-6">
          <span className="font-semibold">{match.player1.name}</span> vs{" "}
          <span className="font-semibold">{match.player2.name}</span>
        </p>

        {error && (
          <div className="bg-danger/10 text-danger rounded-lg p-3 mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Tu código de acceso</label>
            <input
              type="text"
              required
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-center tracking-widest"
              placeholder="XXXXXX"
              maxLength={6}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Marcador por set</span>
              <span className="text-xs text-text-muted">Mejor de {maxSets} ({isPlayoff ? "playoff" : "round robin"})</span>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-xs font-semibold text-text-muted text-center">
                <span>{match.player1.name.split(" ")[0]}</span>
                <span></span>
                <span>{match.player2.name.split(" ")[0]}</span>
              </div>
              {sets.map((set, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={set.p1}
                    onChange={(e) => {
                      const newSets = [...sets];
                      newSets[i] = { ...newSets[i], p1: e.target.value };
                      setSets(newSets);
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="0"
                  />
                  <span className="text-xs text-text-muted font-medium px-1">Set {i + 1}</span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={set.p2}
                    onChange={(e) => {
                      const newSets = [...sets];
                      newSets[i] = { ...newSets[i], p2: e.target.value };
                      setSets(newSets);
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              {sets.length < maxSets && (
                <button type="button" onClick={addSet} className="text-xs text-primary hover:underline">
                  + Agregar set
                </button>
              )}
              {sets.length > 2 && (
                <button type="button" onClick={removeSet} className="text-xs text-danger hover:underline">
                  - Quitar set
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Confirmar Marcador"}
          </button>
        </form>
      </div>
    </div>
  );
}
