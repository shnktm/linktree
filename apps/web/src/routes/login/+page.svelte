<script lang="ts">
  import { resolve } from '$app/paths';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const statusMessages: Record<string, string> = {
    backend_unavailable: 'O serviço de autenticação está indisponível ou incompleto.',
    auth_denied: 'Esta conta não foi autorizada para este ambiente.',
    auth_cancelled: 'A autorização foi cancelada.',
    invalid_state: 'A solicitação expirou. Inicie o login novamente.',
    missing_code: 'O callback não recebeu um código de autorização.',
    session_unavailable: 'Não foi possível criar uma sessão segura.',
  };
</script>

<svelte:head>
  <title>shinikatame / login</title>
  <meta name="description" content="Acesso autenticado ao espaço administrativo de Shinikatame." />
</svelte:head>

<main class="login-shell">
  <p class="eyebrow">⌈ secure access ⌋</p>
  <h1>connect to the wired</h1>
  <p class="intro">
    Entre com Discord para continuar. O acesso administrativo é decidido exclusivamente no servidor.
  </p>

  {#if data.status}
    <p class="status" role="alert">{statusMessages[data.status]}</p>
  {/if}

  {#if data.authConfigured}
    <a class="discord-button" href={resolve('/api/auth/redirect')}>entrar com Discord</a>
  {:else}
    <p class="status" role="status">
      Login ainda não configurado: defina AUTH_SERVICE_URL e AUTH_SESSION_SECRET no ambiente da
      Vercel.
    </p>
  {/if}

  <a class="back-link" href={resolve('/')}>← voltar aos links</a>
</main>

<style>
  .login-shell {
    display: grid;
    width: min(100% - 2rem, 34rem);
    min-height: 100svh;
    margin: 0 auto;
    align-content: center;
    justify-items: center;
    gap: 1rem;
    color: var(--ink);
    text-align: center;
  }

  .eyebrow {
    margin: 0;
    color: var(--wine-bright);
    font-size: 0.65rem;
    letter-spacing: 0.26em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-size: clamp(1.45rem, 5vw, 2rem);
    font-weight: 400;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .intro,
  .status {
    max-width: 30rem;
    margin: 0;
    color: var(--muted);
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    line-height: 1.8;
  }

  .status {
    padding: 0.8rem 1rem;
    border: 1px solid var(--line);
    color: var(--gold);
  }

  .discord-button {
    margin-top: 0.8rem;
    padding: 0.9rem 1.5rem;
    border: 1px solid var(--gold);
    color: var(--ink);
    background: rgba(35, 19, 28, 0.9);
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-decoration: none;
    text-transform: uppercase;
    transition:
      background 180ms ease,
      transform 180ms ease;
  }

  .discord-button:hover,
  .discord-button:focus-visible {
    background: rgba(94, 48, 72, 0.8);
    transform: translateY(-0.12rem);
  }

  .discord-button:focus-visible,
  .back-link:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 4px;
  }

  .back-link {
    margin-top: 1.5rem;
    color: var(--faded);
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-decoration: none;
    text-transform: uppercase;
  }

  .back-link:hover {
    color: var(--ink);
  }
</style>
