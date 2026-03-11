import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const PHASE_LABELS: Record<string, string> = {
  round_robin: "Round Robin",
  octavos: "Octavos de Final",
  cuartos: "Cuartos de Final",
  semis: "Semifinales",
  final: "Final",
  tercer_puesto: "Tercer Puesto",
};

export const STATUS_LABELS: Record<string, string> = {
  registration: "Inscripciones Abiertas",
  round_robin: "Fase Round Robin",
  playoffs: "Playoffs",
  completed: "Temporada Finalizada",
};

export const SEASON_COLORS: Record<string, string> = {
  registration: "bg-blue-500",
  round_robin: "bg-primary",
  playoffs: "bg-accent",
  completed: "bg-gray-500",
};
