<script setup lang="ts">
import { APP_NAME } from '@socle/shared'
</script>

<template>
  <main class="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
    <!-- Panneau de marque sur grand écran ; en dessous, le logo seul au-dessus du formulaire. -->
    <section class="brand-panel relative isolate hidden flex-col justify-between overflow-hidden p-14 text-white lg:flex">
      <BrandLogo play class="text-3xl [&_.text-highlighted]:text-white" />
      <div>
        <h2 class="font-display text-5xl leading-[1.05] font-bold tracking-tight xl:text-6xl">Bienvenue<br>sur {{ APP_NAME }}.</h2>
        <p class="mt-6 max-w-sm text-lg text-white/75">Remplace ce texte par la promesse de ton application (frontend/app/layouts/auth.vue).</p>
      </div>
    </section>

    <section class="flex items-center justify-center px-4 py-12 sm:px-10">
      <div class="w-full max-w-sm">
        <BrandLogo play class="mb-12 text-2xl lg:hidden" />
        <slot />
      </div>
    </section>
  </main>
</template>

<style scoped>
/* Fond de marque : la tuile du logo, quadrillage discret et lueur en haut à gauche. */
.brand-panel {
  background:
    radial-gradient(60% 50% at 10% 0%, rgb(99 102 241 / .45), transparent 70%),
    linear-gradient(rgb(165 180 252 / .07) 1px, transparent 1px) 0 0 / 48px 48px,
    linear-gradient(90deg, rgb(165 180 252 / .07) 1px, transparent 1px) 0 0 / 48px 48px,
    #13112e;
}
</style>
