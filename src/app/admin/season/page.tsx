"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Season {
  id: string;
  name: string;
  status: string;
  playoffSize: number;
  _count?: { players: number; matches: number };
}

export default function AdminSeasonPage() {
  const router = useRouter();
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [playoffSize, setPlayoffSize] = useState(8);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/season")
      .then((r) => r.json())
      .then((data) => {
        setSeason(data.season);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function createSeason() {
    if (!newName) return;
    setActionLoading(true);
    const res = await fetch("/api/admin/season", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, playoffSize }),
    });
    const data = await res.json();
    if (res.ok) {
      setSeason(data.season);
      setNewName("");
      setMessage("Temporada creada exitosamente");
    } else {
      setMessage(data.error || "Error");
    }
    setActionLoading(false);
  }

  async function changeStatus(newStatus: string) {
    if (!season) return;
    setActionLoading(true);
    const res = await fetch("/api/admin/season", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: season.id, status: newStatus }),
    });
    const data = await res.json();
    if (res.ok) {
      setSeason(data.season);
      setMessage(`Estado cambiado a: ${newStatus}`);
    } else {
      setMessage(data.error || "Error");
    }
    setActionLoading(false);
  }

  if (loading) return <p className="text-text-muted">Cargando...</p>;

  const statusActions: Record<string, { label: string; next: string; color: string }[]> = {
    registration: [{ label: "Cerrar Inscripciones e Iniciar Round Robin", next: "round_robin", color: "bg-primary" }],
    round_robin: [{ label: "Avanzar a Playoffs", next: "playoffs", color: "bg-accent" }],
    playoffs: [{ label: "Finalizar Temporada", next: "completed", color: "bg-gray-600" }],
    completed: [],
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">📅 Gestión de Temporada</h2>

      {message && (
        <div className="bg-primary/10 text-primary rounded-lg p-3 text-sm">{message}</div>
      )}

      {season ? (
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-text-muted uppercase">Nombre</div>
              <div className="font-bold">{season.name}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted uppercase">Estado</div>
              <div className="font-bold capitalize">{season.status.replace("_", " ")}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted uppercase">Playoffs</div>
              <div className="font-bold">Top {season.playoffSize}</div>
            </div>
          </div>

          {statusActions[season.status]?.map((action) => (
            <button
              key={action.next}
              onClick={() => changeStatus(action.next)}
              disabled={actionLoading}
              className={`${action.color} hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-opacity disabled:opacity-50 w-full sm:w-auto`}
            >
              {actionLoading ? "Procesando..." : action.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <p className="text-text-muted">No hay temporada activa. Crea una nueva:</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre de la temporada"
              className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <select
              value={playoffSize}
              onChange={(e) => setPlayoffSize(Number(e.target.value))}
              className="px-3 py-2 border border-border rounded-lg"
            >
              <option value={8}>Playoffs: Top 8</option>
              <option value={16}>Playoffs: Top 16</option>
            </select>
            <button
              onClick={createSeason}
              disabled={actionLoading || !newName}
              className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              Crear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
