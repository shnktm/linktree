<script lang="ts">
  interface Props {
    href: string;
    label: string;
  }

  let { href, label }: Props = $props();
</script>

<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
<a class="link-card" {href} target="_blank" rel="noreferrer">
  <span class="link-copy">
    <strong>{label}</strong>
  </span>
</a>
