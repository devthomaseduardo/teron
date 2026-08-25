# Deploy Vercel — TERON

## 1. Importar o repo

1. [vercel.com/new](https://vercel.com/new)
2. Import **devthomaseduardo/teron**
3. Framework: **Next.js** (auto)
4. Root Directory: `.` (raiz)
5. Build: `next build` (ja no `vercel.json`)

## 2. Environment Variables

| Variavel | Obrigatorio | Exemplo |
|----------|-------------|---------|
| `MONGODB_URI` | sim | `mongodb+srv://...` |
| `MONGODB_DB` | nao | `teron` |
| `RESEND_API_KEY` | nao | `re_...` |
| `RESEND_FROM` | nao | `TERON <onboarding@resend.dev>` |
| `NEXT_PUBLIC_SITE_URL` | recomendado | `https://teron.vercel.app` |
| `SITE_URL` | recomendado | mesmo valor |

**Mercado Pago / pagamentos:** desativados. Nao precisa configurar.

## 3. Apos o deploy

Os usuarios demo sao criados no **primeiro login** (seed automatico).

### Portal admin
- URL: `/admin/login`
- E-mail: `admin@teron.studio`
- Senha: `teron-admin`

### Portal cliente
- URL: `/cliente/login`
- E-mail: `cliente@orbita.com`
- Senha: `teron-client`

Login exige **e-mail + senha** (e o perfil da pagina: admin ou cliente).

## 4. Branches

So existe **main**. Nao ha outras branches para sincronizar.
