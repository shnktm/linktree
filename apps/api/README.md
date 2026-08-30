# Wired Links API

API FastAPI responsável pelo OAuth do Discord, sessões e roles. O frontend
SvelteKit conversa com este serviço server-to-server através de
`AUTH_SERVICE_URL`.

## Desenvolvimento local

Na raiz do monorepo:

```bash
docker compose up -d postgres
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
cp .env.example .env
uvicorn app.main:app --reload --port 8001
```

O serviço ficará em `http://localhost:8001`. A documentação OpenAPI está em
`http://localhost:8001/docs`.

## Produção

1. Configure `DATABASE_URL`, credenciais do Discord e `DISCORD_ADMIN_IDS` no
   ambiente da VPS.
2. Cadastre no Discord Developer Portal o valor de `DISCORD_REDIRECT_URI`.
3. Execute `uvicorn app.main:app --host 127.0.0.1 --port 8001` atrás de HTTPS
   e de um reverse proxy.
4. Configure no frontend da Vercel `AUTH_SERVICE_URL` apontando para o prefixo
   `/api` do serviço.

`DISCORD_ADMIN_IDS` é uma lista separada por vírgulas. O ID
`395249144677007370` só deve ser colocado ali se essa for a conta proprietária.
Usuários autenticados que não estiverem nessa lista recebem role `user`.

## Contrato

- `GET /api/discord/redirect?return_url=...&state=...`: inicia o OAuth.
- `POST /api/exchange`: troca o código de uso único por uma sessão opaca.
- `GET /api/verify`: valida um Bearer token.
- `GET|POST /api/logout`: revoga a sessão.

Os tokens são armazenados somente como hash no PostgreSQL. O frontend guarda o
token em cookie `HttpOnly` assinado e nunca em `localStorage`.
