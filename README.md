# Liga de Ping Pong - Portal Web

Portal web para gestionar la liga de ping pong empresarial. Incluye inscripcion, calendario, posiciones en vivo, bracket de playoffs y estadisticas.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **SQLite** via Prisma ORM
- **Tailwind CSS** para estilos
- **NextAuth.js** para autenticacion admin
- **Docker** para despliegue

## Inicio Rapido

### Requisitos
- Node.js 20+
- npm

### Instalacion

```bash
npm install
```

### Configuracion

Copia `.env.example` a `.env` y ajusta los valores:

```bash
cp .env.example .env
```

### Base de Datos

```bash
npx prisma migrate dev
npm run db:seed  # Datos de ejemplo
```

### Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

### Admin

Acceder a [http://localhost:3000/admin/login](http://localhost:3000/admin/login) con las credenciales configuradas en `.env`.

## Docker

### Build y ejecutar

```bash
docker compose up --build
```

La app estara disponible en [http://localhost:3000](http://localhost:3000).

### Variables de entorno

| Variable | Descripcion | Default |
|----------|------------|---------|
| `DATABASE_URL` | URL de la base SQLite | `file:/data/league.db` |
| `NEXTAUTH_URL` | URL publica de la app | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret para sesiones | (requerido) |
| `ADMIN_USERNAME` | Usuario admin | `admin` |
| `ADMIN_PASSWORD` | Password admin | (requerido) |

## Formato de la Liga

### Fase 1: Round Robin
- Todos contra todos
- Mejor de 3 sets (a 11 puntos, ganar por 2)
- Victoria = 3 pts, Derrota = 1 pt, No show = 0 pts

### Fase 2: Playoffs
- Top 8 o Top 16 clasifican
- Eliminacion directa (mejor de 5 sets)
- Octavos -> Cuartos -> Semis -> Final

## Estructura del Proyecto

```
src/
  app/           # Paginas y API routes (Next.js App Router)
  lib/           # Logica de negocio (standings, scheduling, bracket)
  styles/        # Estilos globales
prisma/          # Schema y migraciones de BD
```
