"use client";

import { useState, useEffect } from "react";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface TimeSlotData {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export default function AdminSchedulePage() {
  const [slots, setSlots] = useState<TimeSlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [newSlot, setNewSlot] = useState({ dayOfWeek: 1, startTime: "12:00", endTime: "12:30" });

  useEffect(() => {
    loadSlots();
  }, []);

  async function loadSlots() {
    const res = await fetch("/api/admin/schedule");
    const data = await res.json();
    setSlots(data.slots || []);
    setLoading(false);
  }

  async function addSlot() {
    const res = await fetch("/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSlot),
    });
    if (res.ok) {
      setMessage("Slot agregado");
      loadSlots();
    } else {
      const data = await res.json();
      setMessage(data.error || "Error");
    }
  }

  async function deleteSlot(id: string) {
    const res = await fetch("/api/admin/schedule", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setMessage("Slot eliminado");
      loadSlots();
    }
  }

  async function generateSchedule() {
    setGenerating(true);
    setMessage("");
    const res = await fetch("/api/admin/schedule/generate", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setMessage(`Calendario generado: ${data.matchCount} partidos creados`);
    } else {
      setMessage(data.error || "Error al generar calendario");
    }
    setGenerating(false);
  }

  async function generatePlayoffBracket() {
    setGenerating(true);
    setMessage("");
    const res = await fetch("/api/admin/schedule/generate-playoffs", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setMessage(`Bracket generado: ${data.matchCount} partidos de playoff creados`);
    } else {
      setMessage(data.error || "Error al generar bracket");
    }
    setGenerating(false);
  }

  if (loading) return <p className="text-text-muted">Cargando...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">🗓️ Gestión de Calendario</h2>

      {message && (
        <div className="bg-primary/10 text-primary rounded-lg p-3 text-sm">{message}</div>
      )}

      {/* Generate Buttons */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <h3 className="font-bold">Generar Partidos</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={generateSchedule}
            disabled={generating}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {generating ? "Generando..." : "Generar Calendario Round Robin"}
          </button>
          <button
            onClick={generatePlayoffBracket}
            disabled={generating}
            className="bg-accent hover:bg-accent-dark text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {generating ? "Generando..." : "Generar Bracket de Playoffs"}
          </button>
        </div>
        <p className="text-xs text-text-muted">
          Round Robin: genera todos los enfrentamientos de todos contra todos y los asigna a los slots configurados.
          <br />
          Playoffs: genera el bracket de eliminación basado en las posiciones actuales.
        </p>
      </div>

      {/* Time Slots Config */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <h3 className="font-bold">Slots de Tiempo Disponibles</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-text-muted mb-1">Día</label>
            <select
              value={newSlot.dayOfWeek}
              onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: Number(e.target.value) })}
              className="px-3 py-2 border border-border rounded-lg text-sm"
            >
              {DAYS.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Inicio</label>
            <input
              type="time"
              value={newSlot.startTime}
              onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Fin</label>
            <input
              type="time"
              value={newSlot.endTime}
              onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>
          <button
            onClick={addSlot}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            Agregar
          </button>
        </div>

        {slots.length > 0 ? (
          <div className="space-y-2 mt-4">
            {DAYS.map((day, dayIndex) => {
              const daySlots = slots.filter((s) => s.dayOfWeek === dayIndex);
              if (daySlots.length === 0) return null;
              return (
                <div key={dayIndex}>
                  <span className="text-sm font-medium text-text-muted">{day}:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {daySlots.map((s) => (
                      <span key={s.id} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        {s.startTime} - {s.endTime}
                        <button onClick={() => deleteSlot(s.id)} className="text-danger hover:text-danger/80 ml-1">&times;</button>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No hay slots configurados. Agrega horarios disponibles para los partidos.</p>
        )}
      </div>
    </div>
  );
}
