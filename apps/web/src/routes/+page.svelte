<script lang="ts">
  import { resolve } from '$app/paths';
  import AmbientAudio from '$lib/components/AmbientAudio.svelte';
  import LinkCard from '$lib/components/LinkCard.svelte';
  import SignalBackdrop from '$lib/components/SignalBackdrop.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  let isScrollIndicatorHidden = $state(false);

  const readouts = [
    'scanning for signal...',
    'carrier frequency stable',
    '5 channels available',
    'awaiting transmission...',
  ];

  const links = [
    { label: 'Discord', href: 'https://discord.com/users/395249144677007370' },
    { label: 'AniList', href: 'https://anilist.co/user/Shinikatame/animelist' },
    {
      label: 'Spotify',
      href: 'https://open.spotify.com/user/31gvdwvif2a7j3stz54r4v6asgta?si=846b72b2db214f95',
    },
    {
      label: 'RetroAchievements',
      href: 'https://retroachievements.org/user/Shinikatame',
    },
    { label: 'Steam', href: 'https://steamcommunity.com/id/shinikatame/' },
  ];

  const currentYear = $derived(new Date().getFullYear());
  const signalId = $derived(
    String(
      Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000),
    ).padStart(4, '0'),
  );

  function handleScroll(): void {
    isScrollIndicatorHidden = window.scrollY > 8;
  }
</script>

<svelte:head>
  <title>shinikatame / links</title>
  <meta name="description" content="Os links e as transmissões de Shinikatame." />
</svelte:head>

<svelte:window onscroll={handleScroll} />
<SignalBackdrop />

<header class="site-header" aria-label="Cabeçalho">
  <a class="wordmark" href={resolve('/')} aria-label="Voltar ao início">
    Ｗｉｒｅｄ<span> ／ </span>Ｌｉｎｋｓ
  </a>
  <div class="header-actions">
    <p class="header-status"><span class="status-dot"></span> signal active</p>
    {#if data.session?.role === 'admin'}
      <a class="auth-link" href={resolve('/admin')}>admin</a>
    {:else if data.session}
      <span class="auth-status">connected</span>
    {:else}
      <a class="auth-link" href={resolve('/login')}>login</a>
    {/if}
    <AmbientAudio />
  </div>
</header>

<main class="page-shell">
  <section class="hero" aria-labelledby="profile-name">
    <div class="profile">
      <div class="signal-stage">
        <span class="orbit orbit-one" aria-hidden="true"></span>
        <span class="orbit orbit-two" aria-hidden="true"></span>
        <span class="orbit orbit-three" aria-hidden="true"></span>
        <img
          class="signal-mark"
          src="/assets/wired-login-eye.gif"
          alt="Olho digital da página de login do Fauux"
        />
        <span class="signal-caption" aria-hidden="true">/ / /</span>
      </div>

      <p class="eyebrow"><span>⌈</span> transmission 001 <span>⌋</span></p>
      <h1 id="profile-name" data-text="shinikatame">
        shinikatame<span class="cursor" aria-hidden="true">_</span>
      </h1>
      <p class="profile-bio">
        uma pequena frequência no wired.<br />
        links, música, jogos e outras transmissões.
      </p>

      <div class="profile-meta" aria-label="Informações do perfil">
        <span>◌ online</span>
        <span aria-hidden="true">·</span>
        <span>est. 2024</span>
        <span aria-hidden="true">·</span>
        <span>zone 07</span>
      </div>
      <p class="signal-readout" aria-live="polite">
        <span class="readout-pulse" aria-hidden="true"></span>
        <span class="readout-cycle">
          {#each readouts as readout, index (readout)}
            <span class={index === 0 ? 'readout-first' : ''}>{readout}</span>
          {/each}
        </span>
      </p>
      <div class:hidden={isScrollIndicatorHidden} class="scroll-indicator" aria-hidden="true">
        <span class="scroll-chevron"></span>
      </div>
    </div>
  </section>

  <nav id="links-panel" class="links-panel" aria-label="Links principais">
    <p class="panel-label"><span>///</span> access points</p>
    {#each links as link (link.href)}
      <LinkCard href={link.href} label={link.label} />
    {/each}
  </nav>

  <footer class="site-footer">
    <p>© {currentYear} / all signals reserved</p>
    <p class="footer-code">
      audio: <span>standby</span> · id: <span>{signalId}</span>
    </p>
  </footer>
</main>

<style>
  .auth-link {
    color: var(--faded);
    text-decoration: none;
    transition: color 180ms ease;
  }

  .auth-status {
    color: var(--faded);
  }

  .auth-link:hover,
  .auth-link:focus-visible {
    color: var(--ink);
  }

  .auth-link:focus-visible {
    outline: 1px solid var(--gold);
    outline-offset: 0.35rem;
  }

  :global(.scroll-indicator.hidden) {
    visibility: hidden;
    opacity: 0;
  }

  .readout-cycle {
    position: relative;
    display: inline-grid;
    min-width: 16rem;
    min-height: 1em;
    text-align: left;
  }

  .readout-cycle > span {
    grid-area: 1 / 1;
    opacity: 0;
    animation: readout-cycle 16.8s steps(1, end) infinite;
  }

  .readout-cycle > span:nth-child(2) {
    animation-delay: 4.2s;
  }

  .readout-cycle > span:nth-child(3) {
    animation-delay: 8.4s;
  }

  .readout-cycle > span:nth-child(4) {
    animation-delay: 12.6s;
  }

  .readout-cycle > span.readout-first {
    opacity: 1;
  }

  @keyframes readout-cycle {
    0%,
    24.99% {
      opacity: 1;
    }

    25%,
    100% {
      opacity: 0;
    }
  }
</style>
