# Shinikatame / Wired Links

Monorepo com frontend SvelteKit em `apps/web`, API FastAPI em `apps/api` e
PostgreSQL local definido em `infrastructure/docker-compose.yml`.

## Estrutura

- `apps/web`: frontend e BFF SvelteKit.
- `apps/api`: serviço FastAPI de autenticação Discord e sessões.
- `infrastructure/docker-compose.yml`: somente o serviço PostgreSQL.
- `docs/auth.md`: fluxo de autenticação entre as aplicações.

## Rodar o frontend

A partir da raiz, entre no diretório do SvelteKit:

```bash
cd apps/web
npm ci
cp .env.example .env
npm run dev
```

Abra `http://localhost:5173`. Os checks e a build também são executados em
`apps/web`:

```bash
npm run check
npm run lint
npm run build
npm run preview
```

## Rodar API e banco local

Em outro terminal, a partir da raiz, suba apenas o PostgreSQL:

```bash
docker compose -f infrastructure/docker-compose.yml up -d postgres
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
cp .env.example .env
uvicorn app.main:app --reload --port 8001
```

A API ficará em `http://localhost:8001` e sua documentação em
`http://localhost:8001/docs`. Para parar o banco, use na raiz:

```bash
docker compose -f infrastructure/docker-compose.yml down
```

As variáveis de ambiente ficam em `apps/web/.env` e `apps/api/.env`; os modelos
estão em `apps/web/.env.example` e `apps/api/.env.example`.

## Discord

A rota `apps/web/src/routes/.well-known/discord/+server.ts` publica
`https://seu-dominio/.well-known/discord` como texto `dh=...`, sem HTML.
O login usa os endpoints `/api/auth/*` do SvelteKit e o serviço FastAPI.
O favicon permanece configurado em `apps/web/src/app.html`.
