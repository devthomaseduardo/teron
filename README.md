# TERON — monorepo (web + api)

Separacao do monolito Next.js full-stack em:

```text
apps/
  web/     → Next.js 16 (UI only)
  api/     → Hono + MongoDB + Resend + Mercado Pago
packages/
  shared/  → tipos TypeScript compartilhados
```

## Setup

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# preencha MONGODB_URI em apps/api/.env
```

```bash
pnpm dev:api   # :4000
pnpm dev:web   # :3000
```

Demo: `admin@teron.studio` / `teron-admin` | `cliente@orbita.com` / `teron-client`

## Docker

```bash
docker compose up --build
# ou so Mongo:
docker compose -f docker-compose.dev.yml up -d
```

- Web http://localhost:3000
- API http://localhost:4000/health
- Mongo localhost:27017

Ver [MAPPING.md](./MAPPING.md) para o mapa monolitо → monorepo.
