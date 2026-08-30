<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  let isLoggingOut = $state(false);

  async function logout(): Promise<void> {
    isLoggingOut = true;
    await fetch('/api/auth/logout', { method: 'POST' });
    await goto(resolve('/'));
  }
</script>

<svelte:head>
  <title>shinikatame / admin</title>
</svelte:head>

<main class="admin-shell">
  <p class="eyebrow">⌈ admin channel / verified ⌋</p>
  <h1>control room</h1>
  <p class="intro">
    Sessão autenticada para <strong>{data.user.username ?? data.user.id}</strong>.
  </p>
  <p class="notice">
    A camada de activity adapters ainda é um placeholder. Nenhuma API social é chamada nesta versão.
  </p>
  <button type="button" onclick={logout} disabled={isLoggingOut}>
    {isLoggingOut ? 'encerrando...' : 'encerrar sessão'}
  </button>
  <a href={resolve('/')}>← voltar aos links</a>
</main>

<style>
  .admin-shell {
    display: grid;
    width: min(100% - 2rem, 42rem);
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
    letter-spacing: 0.24em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-size: clamp(1.5rem, 5vw, 2.2rem);
    font-weight: 400;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .intro,
  .notice {
    margin: 0;
    color: var(--muted);
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    line-height: 1.8;
  }

  .notice {
    max-width: 34rem;
    border: 1px solid var(--line);
    padding: 0.8rem 1rem;
    color: var(--gold);
  }

  button {
    margin-top: 0.8rem;
    border: 1px solid var(--gold);
    padding: 0.8rem 1rem;
    color: var(--ink);
    background: var(--wine);
    font: inherit;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
  }

  button:hover:not(:disabled),
  button:focus-visible {
    background: var(--wine-bright);
  }

  button:disabled {
    cursor: wait;
    opacity: 0.6;
  }

  button:focus-visible,
  a:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 4px;
  }

  a {
    color: var(--faded);
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-decoration: none;
    text-transform: uppercase;
  }

  a:hover {
    color: var(--ink);
  }
</style>
