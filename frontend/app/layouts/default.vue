<script setup lang="ts">
import { APP_NAME, ROLE_LABELS, type Permission } from '@socle/shared'
import type { DropdownMenuItem } from '@nuxt/ui'

const { user, can, logout } = useAuth()
const toast = useToast()

async function onLogout() {
  try {
    await logout()
  } catch (e) {
    toast.add({ title: 'Déconnexion impossible', description: apiErrorMessage(e), color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }
  await navigateTo('/login')
}

// Sections : menu en haut sur grand écran, barre d'onglets en bas sur téléphone et tablette (`short` : libellé tenant sous l'icône).
// `permission` : section masquée sans ce droit (la page le vérifie aussi, et l'API de toute façon).
const nav: { label: string, short: string, icon: string, to: string, permission?: Permission }[] = [
  { label: 'Accueil', short: 'Accueil', icon: 'i-lucide-house', to: '/' },
  { label: 'Utilisateurs', short: 'Utilisateurs', icon: 'i-lucide-users', to: '/admin/users', permission: 'users.read' },
  { label: 'Droits', short: 'Droits', icon: 'i-lucide-shield', to: '/admin/roles', permission: 'roles.read' },
]
const items = computed(() => nav.filter((item) => !item.permission || can(item.permission)))
// Une seule section : pas de barre d'onglets, le logo ramène déjà à l'accueil.
const tabs = computed(() => items.value.length > 1)
const route = useRoute()
const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))

const fullName = computed(() => `${user.value?.firstName ?? ''} ${user.value?.lastName ?? ''}`.trim())

const menu = computed<DropdownMenuItem[][]>(() => [
  [{ type: 'label', label: fullName.value, description: user.value?.email }],
  [{ label: 'Mon profil', icon: 'i-lucide-user-round', to: '/profile' }],
  [{ label: 'Se déconnecter', icon: 'i-lucide-log-out', color: 'error', onSelect: onLogout }],
])
</script>

<template>
  <div class="min-h-dvh">
    <header class="bg-default/75 border-default sticky top-0 z-40 border-b backdrop-blur-lg">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
        <div class="flex items-center gap-4 sm:gap-8">
          <NuxtLink to="/" class="rounded-md text-xl focus-visible:outline-2 focus-visible:outline-offset-4" :aria-label="`${APP_NAME}, accueil`"><BrandLogo /></NuxtLink>
          <UNavigationMenu :items="items" class="hidden lg:flex" />
        </div>
        <UDropdownMenu :items="menu" :content="{ align: 'end' }">
          <UButton color="neutral" variant="ghost" trailing-icon="i-lucide-chevron-down" class="gap-2 px-1.5 sm:px-2" :aria-label="`Compte de ${fullName}`">
            <UAvatar :alt="fullName" size="sm" class="bg-primary text-white" :ui="{ fallback: 'text-white font-semibold' }" />
            <span class="hidden text-left leading-tight md:block">
              <span class="text-highlighted block text-sm font-semibold">{{ user?.firstName }}</span>
              <span v-if="user" class="text-muted block text-xs">{{ ROLE_LABELS[user.role] }}</span>
            </span>
          </UButton>
        </UDropdownMenu>
      </div>
    </header>
    <!-- Marge basse sous lg : la barre d'onglets ne cache pas la fin de la page. -->
    <main class="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:pb-8" :class="tabs ? 'pb-[calc(6rem+env(safe-area-inset-bottom))]' : 'pb-8'">
      <slot />
    </main>

    <!-- Barre d'onglets du téléphone et de la tablette, à portée de pouce ; au-dessus de la zone de geste de l'iPhone. -->
    <nav v-if="tabs" aria-label="Sections" class="bg-default/90 border-default fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden">
      <ul class="mx-auto grid max-w-lg auto-cols-fr grid-flow-col">
        <li v-for="item in items" :key="item.to">
          <NuxtLink
            :to="item.to"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            class="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors"
            :class="isActive(item.to) ? 'text-primary' : 'text-muted hover:text-highlighted'"
          >
            <UIcon :name="item.icon" class="size-6" />
            {{ item.short }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </div>
</template>
