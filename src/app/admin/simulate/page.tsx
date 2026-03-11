"use client";

import { useState } from "react";

interface SimulateResult {
  success: boolean;
  champion?: string;
  seasonId?: string;
  totalMatches?: number;
  elapsed?: string;
  log?: string[];
  error?: string;
}

export default function SimulatePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulateResult | null>(null);

  async function handleSimulate() {
    if (!confirm("Esto creará una nueva temporada con 28 jugadores ficticios y simulará todo el ciclo. ¿Continuar?")) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/simulate", { method: "POST" });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: "Error de conexión" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Simulacion de Liga</h1>
        <p className="text-text-muted text-sm mt-1">
          Crea una temporada con 28 jugadores ficticios y simula el ciclo completo (round-robin + playoffs).
          Solo para verificacion de funcionalidad.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>Nota:</strong> Cada ejecucion crea una nueva temporada independiente. Los datos de simulacion
        no afectan temporadas reales. La operacion puede tardar 30-120 segundos.
      </div>

      <button
        onClick={handleSimulate}
        disabled={loading}
        className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? "Simulando... (puede tardar 1-2 min)" : "Simular 28 Jugadores - Ciclo Completo"}
      </button>

      {result && (
        <div className={`rounded-lg border p-4 space-y-3 ${result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          {result.success ? (
            <>
              <div className="font-bold text-green-800 text-lg">
                Simulacion completada en {result.elapsed}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded p-3 border border-green-200">
                  <div className="text-text-muted">Campeon</div>
                  <div className="font-bold text-lg">{result.champion}</div>
                </div>
                <div className="bg-white rounded p-3 border border-green-200">
                  <div className="text-text-muted">Total partidos</div>
                  <div className="font-bold text-lg">{result.totalMatches}</div>
                </div>
              </div>
              <div className="text-sm text-green-700 font-medium">Verificar en el portal:</div>
              <div className="flex flex-wrap gap-2 text-sm">
                {["/standings", "/bracket", "/schedule", "/stats"].map((path) => (
                  <a
                    key={path}
                    href={path}
                    target="_blank"
                    className="bg-white border border-green-300 text-green-700 px-3 py-1 rounded hover:bg-green-50"
                  >
                    {path}
                  </a>
                ))}
              </div>
            </>
          ) : (
            <div className="text-red-800 font-medium">Error: {result.error}</div>
          )}

          {result.log && result.log.length > 0 && (
            <div className="bg-gray-900 text-green-400 rounded p-3 text-xs font-mono space-y-1 max-h-64 overflow-y-auto">
              {result.log.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
