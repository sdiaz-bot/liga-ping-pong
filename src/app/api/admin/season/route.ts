import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const season = await prisma.season.findFirst({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { players: true, matches: true } } },
  });
  return NextResponse.json({ season });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, playoffSize } = body;

  if (!name) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const season = await prisma.season.create({
    data: { name, playoffSize: playoffSize || 8 },
  });

  return NextResponse.json({ season });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json({ error: "ID y estado requeridos" }, { status: 400 });
  }

  const validTransitions: Record<string, string[]> = {
    registration: ["round_robin"],
    round_robin: ["playoffs"],
    playoffs: ["completed"],
  };

  const current = await prisma.season.findUnique({ where: { id } });
  if (!current) {
    return NextResponse.json({ error: "Temporada no encontrada" }, { status: 404 });
  }

  if (!validTransitions[current.status]?.includes(status)) {
    return NextResponse.json({ error: `No se puede cambiar de ${current.status} a ${status}` }, { status: 400 });
  }

  const season = await prisma.season.update({
    where: { id },
    data: {
      status,
      startDate: status === "round_robin" ? new Date() : undefined,
      endDate: status === "completed" ? new Date() : undefined,
    },
  });

  return NextResponse.json({ season });
}
