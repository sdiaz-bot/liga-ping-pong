import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAccessCode } from "@/lib/utils";

export async function GET() {
  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(players);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, department, skillLevel } = body;

    if (!name || !email || !department) {
      return NextResponse.json({ error: "Nombre, email y departamento son requeridos" }, { status: 400 });
    }

    // Check if registration is open
    const season = await prisma.season.findFirst({
      where: { status: "registration" },
      orderBy: { createdAt: "desc" },
    });

    if (!season) {
      return NextResponse.json({ error: "Las inscripciones no están abiertas" }, { status: 400 });
    }

    // Check duplicate email
    const existing = await prisma.player.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Este email ya está registrado" }, { status: 400 });
    }

    // Generate unique access code
    let accessCode = generateAccessCode();
    let attempts = 0;
    while (attempts < 10) {
      const exists = await prisma.player.findUnique({ where: { accessCode } });
      if (!exists) break;
      accessCode = generateAccessCode();
      attempts++;
    }

    const player = await prisma.player.create({
      data: {
        name,
        email,
        department,
        skillLevel: skillLevel || "intermedio",
        accessCode,
        seasonId: season.id,
      },
    });

    return NextResponse.json({ id: player.id, accessCode: player.accessCode }, { status: 201 });
  } catch (error) {
    console.error("Error creating player:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
