import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Liga de Ping Pong",
  description: "Portal oficial de la Liga de Ping Pong empresarial",
};

function Navbar() {
  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏓</span>
            <span className="font-bold text-lg text-primary">Liga Ping Pong</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/standings">Posiciones</NavLink>
            <NavLink href="/schedule">Calendario</NavLink>
            <NavLink href="/bracket">Bracket</NavLink>
            <NavLink href="/stats">Estadísticas</NavLink>
            <NavLink href="/rules">Reglamento</NavLink>
            <NavLink href="/register">Inscripción</NavLink>
          </div>
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-md text-sm font-medium text-text-muted hover:text-primary hover:bg-primary/5 transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileMenu() {
  return (
    <div className="md:hidden">
      <details className="relative">
        <summary className="list-none cursor-pointer p-2 rounded-md hover:bg-gray-100">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </summary>
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-border py-2 z-50">
          <MobileNavLink href="/standings">Posiciones</MobileNavLink>
          <MobileNavLink href="/schedule">Calendario</MobileNavLink>
          <MobileNavLink href="/bracket">Bracket</MobileNavLink>
          <MobileNavLink href="/stats">Estadísticas</MobileNavLink>
          <MobileNavLink href="/rules">Reglamento</MobileNavLink>
          <MobileNavLink href="/register">Inscripción</MobileNavLink>
        </div>
      </details>
    </div>
  );
}

function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block px-4 py-2 text-sm text-text-muted hover:text-primary hover:bg-primary/5">
      {children}
    </Link>
  );
}

function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-text-muted">
        <p>🏓 Liga de Ping Pong Empresarial &copy; {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-bg">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
