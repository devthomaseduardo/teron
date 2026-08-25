# TERON

Estúdio de produto digital. Workspace conectado:

```text
diagnóstico → proposta → operação (admin) → portal do cliente
```

## O que já funciona

| Área | Status |
|------|--------|
| Landing + login admin/cliente | Pronto (front) |
| Autenticação por sessão (cookie httpOnly) | Pronto |
| Diagnósticos (criar + listar) | Pronto |
| Propostas (criar, salvar, enviar e-mail) | Pronto (precisa Resend) |
| MongoDB | Pronto (precisa URI) |

## Setup rápido

```bash
git clone https://github.com/devthomaseduardo/teron.git
cd teron
pnpm install
cp .env.example .env.local
```

Preencha no `.env.local`:

1. **MONGODB_URI** — connection string do MongoDB Atlas  
2. **RESEND_API_KEY** — chave do Resend (envio de propostas)  
3. **RESEND_FROM** — remetente (pode começar com o domínio de teste do Resend)

Depois:

```bash
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Usuários demo (seed automático)

Na primeira conexão com o banco vazio, a app cria:

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | `admin@teron.studio` | `teron-admin` |
| Cliente | `cliente@orbita.com` | `teron-client` |

Rotas de login:

- Admin → `/admin/login`
- Cliente → `/cliente/login`

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- MongoDB (driver nativo)
- Resend (e-mail)
- Tailwind CSS 4 · Lucide

## Estrutura

```text
app/
  page.tsx              # landing + painéis (admin / cliente)
  admin/login/          # login equipe
  cliente/login/        # login cliente
  api/
    auth/login|me       # sessão
    diagnoses           # diagnósticos
    proposals           # propostas + e-mail
lib/
  mongodb.ts            # conexão, tipos, seed, sessão
  teron-data.ts         # dados estáticos de UI
components/
  teron-auth-login.tsx  # formulário de login
```

## Fluxo atual

1. Cliente entra no portal e envia **diagnóstico** (nicho + respostas).
2. Admin vê o diagnóstico e monta a **proposta** (título, escopo, investimento).
3. Ao salvar, a proposta é gravada no MongoDB e, se `RESEND_API_KEY` existir, o e-mail é enviado ao cliente.
4. Cliente atualiza o painel e vê as propostas recebidas.

## Próximos passos (funcionalidades)

- Hash de senha (bcrypt/argon2) no lugar de texto plano no seed
- Proposal Room pública com token + assinatura
- Mercado Pago (sinal)
- Projetos, cronograma, materiais e solicitações no portal
- Provisionamento de senha do cliente após aprovação

## Deploy

Branch de produção: `main` → Vercel. Configure as mesmas variáveis de ambiente no painel da Vercel.
