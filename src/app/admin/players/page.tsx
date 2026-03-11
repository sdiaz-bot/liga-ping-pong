"use client";

import { useState, useEffect } from "react";

interface Player {
  id: string;
  name: string;
  email: string;
  department: string;
  skillLevel: string;
  accessCode: string;
  isActive: boolean;
  registeredAt: string;
}

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    const res = await fetch("/api/admin/players");
    const data = await res.json();
    setPlayers(data.players || []);
    setLoading(false);
  }

  async function toggleActive(id: string, isActive: boolean) {
    const res = await fetch("/api/admin/players", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    if (res.ok) {
      setMessage(`Jugador ${!isActive ? "activado" : "desactivado"}`);
      loadPlayers();
    }
  }

  async function regenerateCode(id: string) {
    const res = await fetch("/api/admin/players", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, regenerateCode: true }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessage(`Nuevo código: ${data.player.accessCode}`);
      loadPlayers();
    }
  }

  if (loading) return <p className="text-text-muted">Cargando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">👥 Gestión de Jugadores</h2>
        <span className="text-sm text-text-muted">{players.length} jugadores</span>
      </div>

      {message && (
        <div className="bg-primary/10 text-primary rounded-lg p-3 text-sm">{message}</div>
      )}

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-text-muted">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold text-text-muted hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-text-muted hidden md:table-cell">Depto</th>
                <th className="px-4 py-3 text-center font-semibold text-text-muted">Código</th>
                <th className="px-4 py-3 text-center font-semibold text-text-muted">Estado</th>
                <th className="px-4 py-3 text-center font-semibold text-text-muted">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className={`border-t border-border ${!p.isActive ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-text-muted hidden sm:table-cell">{p.email}</td>
                  <td className="px-4 py-3 text-text-muted hidden md:table-cell">{p.department}</td>
                  <td className="px-4 py-3 text-center font-mono text-xs">{p.accessCode}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.isActive ? "bg-success/10 text-success" : "bg-gray-100 text-text-muted"}`}>
                      {p.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => toggleActive(p.id, p.isActive)}
                        className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        {p.isActive ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        onClick={() => regenerateCode(p.id)}
                        className="text-xs px-2 py-1 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                      >
                        Nuevo Código
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
