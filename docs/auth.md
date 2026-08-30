# Autenticação

O frontend em `apps/web` roda na Vercel e usa um BFF SvelteKit para conversar
com a API FastAPI em `apps/api` (ou com a API hospedada na VPS). Configure
`AUTH_SERVICE_URL` e `AUTH_SESSION_SECRET` em `apps/web/.env`. A allowlist
`DISCORD_ADMIN_IDS` fica somente em `apps/api/.env` e nunca é enviada ao
navegador.

## Fluxo

1. `GET /api/auth/redirect` cria um `state` aleatório em cookie HttpOnly e
   redireciona para `AUTH_SERVICE_URL/discord/redirect`.
2. O serviço OAuth devolve um código de uso único para
   `/api/auth/callback`.
3. O callback chama, server-side, `POST AUTH_SERVICE_URL/exchange` com
   `{ code, state, redirectUri }`. O serviço deve invalidar o código após o
   primeiro uso e responder:

   ```json
   {
     "access_token": "token-temporario",
     "expires_in": 3600,
     "user": { "id": "discord-id", "username": "nome" },
     "role": "admin"
   }
   ```

4. O BFF guarda o token somente em cookie `HttpOnly`, `Secure` em produção,
   `SameSite=Lax`, assinado por `AUTH_SESSION_SECRET`. O token nunca vai para
   `localStorage`, HTML ou query string.
5. `/admin` valida a sessão no servidor com `GET AUTH_SERVICE_URL/verify` e
   usa a role calculada pela API a partir de `DISCORD_ADMIN_IDS`.

O serviço de referência atualmente documenta `/discord/redirect`, `/discord`,
`/verify` e `/logout`, mas não expõe `/exchange`. Por isso o login permanece
configurável até a API VPS oferecer esse contrato BFF seguro; a aplicação não
finge um login bem-sucedido.

## Origens diferentes

O navegador só acessa os endpoints `/api/auth/*` do frontend. Assim, a API não
precisa liberar CORS para o browser. As chamadas do BFF para a VPS são
server-to-server. Se o fluxo for alterado para chamar a API diretamente,
configure CORS com a origem exata da Vercel, `credentials: true` e cookies
compatíveis com `SameSite=None; Secure`; não use `*`.

`POST /api/auth/logout` limpa o cookie local e tenta revogar a sessão na VPS.
`GET /api/auth/logout` existe como atalho de navegação e redireciona para `/`.

## Verificação do Discord

`apps/web/src/routes/.well-known/discord/+server.ts` responde como texto em
`https://seu-dominio/.well-known/discord`. A rota retorna diretamente o valor
`dh=...`; não altere o `content-type` para HTML, porque o Discord consulta
exatamente esse caminho.
