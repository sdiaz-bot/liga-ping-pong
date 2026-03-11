import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: "managed-via-env",
    },
  });

  // Create a sample season
  const season = await prisma.season.upsert({
    where: { id: "season-1" },
    update: {},
    create: {
      id: "season-1",
      name: "Liga Ping Pong - Temporada 1",
      status: "registration",
      playoffSize: 8,
    },
  });

  // Create sample players
  const samplePlayers = [
    { name: "Carlos García", email: "carlos@empresa.com", department: "Ingeniería", skillLevel: "avanzado" },
    { name: "María López", email: "maria@empresa.com", department: "Marketing", skillLevel: "intermedio" },
    { name: "Juan Rodríguez", email: "juan@empresa.com", department: "Ventas", skillLevel: "principiante" },
    { name: "Ana Martínez", email: "ana@empresa.com", department: "RRHH", skillLevel: "intermedio" },
    { name: "Pedro Sánchez", email: "pedro@empresa.com", department: "Finanzas", skillLevel: "avanzado" },
    { name: "Laura Hernández", email: "laura@empresa.com", department: "Ingeniería", skillLevel: "intermedio" },
    { name: "Diego Torres", email: "diego@empresa.com", department: "Marketing", skillLevel: "principiante" },
    { name: "Sofía Ramírez", email: "sofia@empresa.com", department: "Ventas", skillLevel: "avanzado" },
  ];

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function genCode() {
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  for (const p of samplePlayers) {
    await prisma.player.upsert({
      where: { email: p.email },
      update: {},
      create: {
        ...p,
        accessCode: genCode(),
        seasonId: season.id,
      },
    });
  }

  console.log("Seed completado: 1 temporada, 8 jugadores de ejemplo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
