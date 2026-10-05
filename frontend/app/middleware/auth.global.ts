// Pages privées par défaut ; `definePageMeta({ guest: true })` pour les pages réservées aux visiteurs,
// `definePageMeta({ permission: '…' })` pour une page qui demande un droit (sinon retour à l'accueil).
export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchUser, can } = useAuth()
  if (user.value === undefined) await fetchUser()

  if (!user.value && !to.meta.guest) return navigateTo('/login')
  if (user.value && to.meta.guest) return navigateTo('/')
  if (to.meta.permission && !can(to.meta.permission)) return navigateTo('/')
})
