# TERON — monorepo (web + api)

Separacao do monolito Next.js full-stack em:

```text
apps/
  web/     → Next.js 16 (UI only)
  api/     → Hono + MongoDB + Resend + Mercado Pago
packages/
  shared/  → tipos TypeScript compartilhados
```

## Acesso demo (recrutador)

Usuarios criados automaticamente no primeiro login (ou via `pnpm seed`):

| Perfil  | URL              | E-mail                 | Senha         |
|---------|------------------|------------------------|---------------|
| **Admin**   | `/admin/login`   | `admin@teron.studio`   | `teron-admin`   |
| **Cliente** | `/cliente/login` | `cliente@orbita.com`   | `teron-client`  |

Fluxo sugerido para avaliacao:

1. Entre como **cliente** → envie um diagnostico.
2. Saia e entre como **admin** → veja o diagnostico e crie uma proposta.
3. Volte como **cliente** → confira a proposta recebida.

## Setup

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# preencha MONGODB_URI em apps/api/.env

pnpm seed          # garante usuarios demo no Mongo
pnpm test          # testes de contrato (sem banco)
# pnpm test:db     # testes + seed no Mongo (precisa MONGODB_URI)

pnpm dev:api       # :4000
pnpm dev:web       # :3001
```

## Docker

```bash
docker compose up --build
# ou so Mongo:
docker compose -f docker-compose.dev.yml up -d
```

- Web local http://localhost:3001
- Web Docker http://localhost:3000
- API http://localhost:4000/health
- Mongo localhost:27017

Ver [MAPPING.md](./MAPPING.md) para o mapa monolito → monorepo.
