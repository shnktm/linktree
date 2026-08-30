# Shinikatame / Wired Links

Monorepo com frontend SvelteKit para a landing page e API FastAPI para
autenticação Discord e sessões PostgreSQL.

## Rodar o frontend

Na raiz do projeto:

```bash
npm install
cp .env.example .env
npm run dev
```

Abra `http://localhost:5173`.

Para produção:

```bash
npm run check
npm run build
npm run preview
```

## Rodar API e banco local

Em um segundo terminal:

```bash
docker compose up -d postgres
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
cp .env.example .env
uvicorn app.main:app --reload --port 8001
```

No `.env` do frontend, use:

```dotenv
AUTH_SERVICE_URL=http://localhost:8001/api
AUTH_SESSION_SECRET=gere-um-segredo-longo-e-aleatorio
COOKIE_SECURE=false
```

O backend exige `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`,
`DISCORD_REDIRECT_URI` e `DISCORD_ADMIN_IDS` no próprio
`backend/.env`. A role `admin` só é atribuída a IDs presentes nessa lista.

## Discord

O arquivo `static/.well-known/discord` é publicado em:

```text
https://seu-dominio/.well-known/discord
```

Ele deve continuar sendo um arquivo de texto com o valor `dh=...`, sem HTML.
Esse é o endereço para referenciar a conexão/verificação do Discord.
