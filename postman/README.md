# TERON API no Postman

Importe estes arquivos no workspace do Postman:

- `teron-api.postman_collection.json`
- `teron-local.postman_environment.json`

## Fluxo recomendado

1. Rode a API local em `http://localhost:4000`.
2. Selecione o environment `TERON Local`.
3. Execute `Auth / Login - Admin` ou `Auth / Login - Cliente`.
4. O Postman deve guardar automaticamente o cookie `teron_session`.
5. Use as rotas protegidas depois do login.

Antes do login funcionar, a API precisa encontrar `apps/api/.env` com `MONGODB_URI`.
Para desenvolvimento local, suba o Mongo com `docker compose -f docker-compose.dev.yml up -d`.
Depois de criar ou alterar o `.env`, reinicie o `pnpm dev` para a API carregar as variaveis.

## Variaveis principais

- `baseUrl`: URL da API.
- `adminEmail` e `adminPassword`: credenciais demo do seed local.
- `clientEmail` e `clientPassword`: credenciais demo do seed local.
- `diagnosisId`: preenchida ao criar ou listar diagnosticos.
- `proposalId`: preenchida ao listar propostas.
- `mpPaymentId`: usada apenas para simular webhook real do Mercado Pago.

## Observacoes

- `POST /proposals` pode responder `503` quando `RESEND_API_KEY` nao estiver configurada. Nesse caso a proposta ainda e salva como rascunho.
- `POST /mercadopago/checkout` exige `MERCADOPAGO_ACCESS_TOKEN` configurada no ambiente da API.
- Se o Postman mostrar erro ao fazer parse de JSON, confira o body bruto da resposta. Erros de configuracao agora voltam como JSON com campo `error`.
- A API atual tambem aceita os paths legados com `/api/*`, mas a collection usa as rotas canonicas do servico.
- Para webhook real em desenvolvimento, use uma URL publica via tunnel e configure `NEXT_PUBLIC_SITE_URL`.
