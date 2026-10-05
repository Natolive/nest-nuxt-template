import { APP_NAME } from '@socle/shared'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  app: {
    // Pages à racine unique (sinon la transition casse).
    pageTransition: { name: 'page', mode: 'out-in' },
    // Nom de l'appli en suffixe de chaque titre d'onglet (une page donne seulement son titre).
    head: {
      titleTemplate: `%s · ${APP_NAME}`,
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      // viewport-fit=cover : la barre d'onglets mobile tient compte de la zone de geste (safe-area).
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#1e1b4b' },
      ],
    },
  },
  modules: ['@nuxt/ui'],
  // Thème clair uniquement.
  ui: { colorMode: false },
  css: ['~/assets/css/main.css'],
  // Space Grotesk pour le nom et les titres ; texte courant dans la police de Nuxt UI.
  fonts: { families: [{ name: 'Space Grotesk', provider: 'google', weights: [600, 700] }] },
  // L'API passe par le front sous /api, en dev comme en prod : une seule origine, ni CORS ni cookie tiers.
  routeRules: { '/api/**': { proxy: 'http://backend:3000/**' } },
})
