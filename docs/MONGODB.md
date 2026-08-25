# MongoDB — TERON

Banco: **`teron`**  
Collections: `users`, `sessions`, `diagnoses`, `proposals`, `projects`, `activity`

## Opcao A — Local (Docker)

```bash
docker compose -f docker-compose.dev.yml up -d
```

Em `apps/api/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=teron
```

```bash
pnpm init-db
```

## Opcao B — MongoDB Atlas (nuvem, gratis M0)

1. Acesse [cloud.mongodb.com](https://cloud.mongodb.com) e entre no projeto **DEVTHOMAS** (ou crie um).
2. **Create** → **Shared / Free (M0)** → escolha regiao → Create Cluster.
3. **Database Access** → Add User → usuario + senha (anote).
4. **Network Access** → Add IP → `0.0.0.0/0` (demo) ou seu IP.
5. **Database** → **Connect** → **Drivers** → copie a URI:

```text
mongodb+srv://USER:SENHA@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

6. Cole em `apps/api/.env` e na Vercel:

```env
MONGODB_URI=mongodb+srv://USER:SENHA@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=teron
```

7. Rode:

```bash
pnpm init-db
```

### Importante sobre a chave `al-...`

A chave **Admin API** (`al-...`) **nao** e connection string.  
Serve so para API de administracao do Atlas (criar cluster via API).  
O app TERON usa **somente** `MONGODB_URI` no formato `mongodb://` ou `mongodb+srv://`.

## Verificar

```bash
# API com health + ping
curl http://localhost:4000/health
# { "ok": true, "mongo": "ok", ... }
```

## Usuarios demo (apos init-db)

| Role   | E-mail                 | Senha          |
|--------|------------------------|----------------|
| admin  | admin@teron.studio     | teron-admin    |
| client | cliente@orbita.com     | teron-client   |
