<script setup lang="ts">
// Symbole : trois blocs empilés du plus large au plus étroit (un piédestal) sur tuile sombre, identique à public/favicon.svg.
// `play` : les blocs se posent l'un après l'autre à l'affichage (connexion) ; sinon l'animation rejoue au survol du lien qui le contient.
withDefaults(defineProps<{ play?: boolean }>(), { play: false })
</script>

<template>
  <svg viewBox="0 0 48 48" class="mark" :class="{ play }" aria-hidden="true">
    <rect width="48" height="48" rx="8" fill="#1e1b4b" />
    <rect class="drop drop-1" x="8" y="30" width="32" height="7" fill="#4338ca" />
    <rect class="drop drop-2" x="13" y="21" width="22" height="7" fill="#6366f1" />
    <rect class="drop drop-3" x="18" y="12" width="12" height="7" fill="#a5b4fc" />
  </svg>
</template>

<style scoped>
.play .drop, a:hover .drop, a:focus-visible .drop { animation: drop .35s cubic-bezier(.3, 1.4, .5, 1) both; }
.play .drop-2, a:hover .drop-2, a:focus-visible .drop-2 { animation-delay: .08s; }
.play .drop-3, a:hover .drop-3, a:focus-visible .drop-3 { animation-delay: .16s; }

@keyframes drop {
  from { opacity: 0; transform: translateY(-6px); }
}

@media (prefers-reduced-motion: reduce) {
  .drop { animation: none !important; }
}
</style>
