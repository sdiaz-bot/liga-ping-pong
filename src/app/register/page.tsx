"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", department: "", skillLevel: "intermedio" });
  const [result, setResult] = useState<{ success: boolean; accessCode?: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, accessCode: data.accessCode });
      } else {
        setResult({ success: false, error: data.error || "Error al registrarse" });
      }
    } catch {
      setResult({ success: false, error: "Error de conexión" });
    } finally {
      setLoading(false);
    }
  }

  if (result?.success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-border">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-primary mb-2">¡Registro Exitoso!</h1>
          <p className="text-text-muted mb-6">Tu código de acceso para registrar marcadores es:</p>
          <div className="bg-primary/10 rounded-lg p-4 mb-6">
            <span className="text-3xl font-mono font-bold text-primary tracking-widest">{result.accessCode}</span>
          </div>
          <p className="text-sm text-danger font-medium">
            ⚠️ Guarda este código. Lo necesitarás para registrar los resultados de tus partidos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="bg-white rounded-xl p-8 shadow-sm border border-border">
        <h1 className="text-2xl font-bold text-center mb-2">📝 Inscripción</h1>
        <p className="text-text-muted text-center mb-8">Únete a la Liga de Ping Pong</p>

        {result?.error && (
          <div className="bg-danger/10 text-danger rounded-lg p-3 mb-6 text-sm">{result.error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre completo</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email corporativo</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="tu@empresa.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Departamento</label>
            <input
              type="text"
              required
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ej: Ingeniería, Marketing..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nivel de habilidad</label>
            <select
              value={form.skillLevel}
              onChange={(e) => setForm({ ...form, skillLevel: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="principiante">Principiante</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Inscribirme"}
          </button>
        </form>
      </div>
    </div>
  );
}
