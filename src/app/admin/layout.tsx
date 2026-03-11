import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">⚙️ Panel de Administración</h1>
      </div>
      <div className="flex flex-col sm:flex-row gap-6">
        <nav className="sm:w-48 flex-shrink-0">
          <div className="bg-white rounded-xl border border-border p-2 space-y-1 sm:sticky sm:top-20">
            <AdminNavLink href="/admin">Dashboard</AdminNavLink>
            <AdminNavLink href="/admin/season">Temporada</AdminNavLink>
            <AdminNavLink href="/admin/players">Jugadores</AdminNavLink>
            <AdminNavLink href="/admin/schedule">Calendario</AdminNavLink>
            <AdminNavLink href="/admin/matches">Partidos</AdminNavLink>
            <AdminNavLink href="/admin/simulate">Simular</AdminNavLink>
          </div>
        </nav>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

function AdminNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded-md text-sm font-medium text-text-muted hover:text-primary hover:bg-primary/5 transition-colors"
    >
      {children}
    </Link>
  );
}
