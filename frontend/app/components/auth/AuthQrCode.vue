<script setup lang="ts">
import { renderSVG } from 'uqr'

// QR code à scanner avec l'application d'authentification ; SVG produit localement (la clé ne quitte pas le navigateur).
const props = defineProps<{ value: string, label: string }>()
const svg = computed(() => renderSVG(props.value, { border: 2, whiteColor: '#ffffff', blackColor: '#0b1512' }))
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html : SVG généré par uqr à partir de notre propre URL otpauth. -->
  <div class="size-44 overflow-hidden rounded-md border border-default bg-white p-1 [&_svg]:size-full" role="img" :aria-label="label" v-html="svg" />
</template>
