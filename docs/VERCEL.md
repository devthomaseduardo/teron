# Deploy Vercel — TERON

## Configuracao obrigatoria do projeto

No painel Vercel → **Project Settings → General**:

| Campo | Valor |
|-------|--------|
| **Framework Preset** | Next.js |
| **Root Directory** | **`.`** (raiz do repo — **nao** `apps/api`) |
| **Build Command** | `pnpm exec next build` |
| **Install Command** | `pnpm install` |
| **Output** | default Next (`.next`) |

Se o Root Directory estiver em `apps/api` ou `apps/web`, voce vera so API ou build quebrado.

## Environment Variables

| Variavel | Obrigatorio |
|----------|-------------|
| `MONGODB_URI` | sim |
| `MONGODB_DB` | `teron` (sem espaco) |
| `RESEND_API_KEY` | nao |
| `NEXT_PUBLIC_SITE_URL` | URL do deploy |
| `SITE_URL` | mesma URL |

Pagamentos desativados — nao precisa Mercado Pago.

## URLs do front (apos deploy)

| Pagina | Path |
|--------|------|
| Home | `/` |
| Login cliente | `/cliente/login` |
| Login admin | `/admin/login` |
| Diagnostico | `/diagnostico` |
| Proposal Room | `/proposta/[token]` |

APIs ficam em `/api/...` (ex.: `/api/auth/login`). O site **nao** e so a API.

## Demo

| Portal | E-mail | Senha |
|--------|--------|-------|
| Cliente | `cliente@orbita.com` | `teron-client` |
| Admin | `admin@teron.studio` | `teron-admin` |
