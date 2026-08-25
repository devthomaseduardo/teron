# TERON

Produtos digitais com clareza — diagnosticos, propostas e portal cliente/admin.

## Demo (recrutador)

| Portal | URL | E-mail | Senha |
|--------|-----|--------|-------|
| **Admin** | `/admin/login` | `admin@teron.studio` | `teron-admin` |
| **Cliente** | `/cliente/login` | `cliente@orbita.com` | `teron-client` |

Login: **e-mail + senha** (na pagina certa: admin ou cliente).

## Deploy Vercel

Ver [docs/VERCEL.md](./docs/VERCEL.md).

Variaveis minimas: `MONGODB_URI`, `MONGODB_DB=teron`.

Pagamentos (Mercado Pago) **desativados** neste deploy.

## Local

```bash
npm install
# .env.local com MONGODB_URI
npm run dev
```

Monorepo (API Hono separada): `apps/api`, `apps/web` — ver [MAPPING.md](./MAPPING.md).
