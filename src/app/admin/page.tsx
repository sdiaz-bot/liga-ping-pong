import { prisma } from "@/lib/prisma";
import { STATUS_LABELS } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const season = await prisma.season.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      players: true,
      matches: true,
    },
  });

  const playerCount = season?.players.length || 0;
  const totalMatches = season?.matches.length || 0;
  const completedMatches = season?.matches.filter((m) => m.status === "completed").length || 0;
  const pendingMatches = totalMatches - completedMatches;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashCard label="Temporada" value={season?.name || "Ninguna"} isText />
        <DashCard label="Estado" value={season ? STATUS_LABELS[season.status] : "—"} isText />
        <DashCard label="Jugadores" value={playerCount} />
        <DashCard label="Partidos" value={`${completedMatches}/${totalMatches}`} isText />
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="font-bold text-lg mb-4">Acciones Rápidas</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link href="/admin/season" className="block p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
            <div className="font-medium">📅 Gestionar Temporada</div>
            <div className="text-sm text-text-muted mt-1">Crear, cambiar estado, configurar playoffs</div>
          </Link>
          <Link href="/admin/players" className="block p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
            <div className="font-medium">👥 Gestionar Jugadores</div>
            <div className="text-sm text-text-muted mt-1">Ver inscritos, activar/desactivar, códigos</div>
          </Link>
          <Link href="/admin/schedule" className="block p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
            <div className="font-medium">🗓️ Generar Calendario</div>
            <div className="text-sm text-text-muted mt-1">Configurar slots y generar partidos</div>
          </Link>
          <Link href="/admin/matches" className="block p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
            <div className="font-medium">🏓 Gestionar Partidos</div>
            <div className="text-sm text-text-muted mt-1">Registrar resultados, corregir marcadores</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function DashCard({ label, value, isText }: { label: string; value: string | number; isText?: boolean }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-border">
      <div className="text-xs text-text-muted uppercase tracking-wide">{label}</div>
      <div className={`font-bold mt-1 ${isText ? "text-sm" : "text-2xl text-primary"}`}>{value}</div>
    </div>
  );
}
