import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const season = await prisma.season.findFirst({ orderBy: { createdAt: "desc" } });
  if (!season) return NextResponse.json({ slots: [] });

  const slots = await prisma.timeSlot.findMany({
    where: { seasonId: season.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json({ slots });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { dayOfWeek, startTime, endTime } = body;

  const season = await prisma.season.findFirst({ orderBy: { createdAt: "desc" } });
  if (!season) return NextResponse.json({ error: "No hay temporada activa" }, { status: 400 });

  const slot = await prisma.timeSlot.create({
    data: { seasonId: season.id, dayOfWeek, startTime, endTime },
  });

  return NextResponse.json({ slot });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { id } = body;
  await prisma.timeSlot.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
