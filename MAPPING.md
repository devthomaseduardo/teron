# Mapeamento monolitо → monorepo

| Antes | Depois |
|-------|--------|
| `app/page.tsx` | `apps/web/app/page.tsx` |
| `app/api/*` | `apps/api/src/routes/*` |
| `lib/mongodb.ts` | `apps/api/src/lib/mongodb.ts` + `packages/shared` |
| `lib/mercadopago.ts` | `apps/api/src/lib/mercadopago.ts` |
| `components/*` | `apps/web/components/*` |

Rotas API (Hono): `/auth`, `/diagnoses`, `/proposals`, `/mercadopago` (+ alias `/api/*`).

Frontend chama `NEXT_PUBLIC_API_URL` via `apps/web/lib/api.ts`.
