<script setup lang="ts">
import { APP_NAME, ROLE_LABELS, type HealthDto } from '@socle/shared'

// Accueil de la personne connectée : point de départ à remplacer par le tableau de bord du projet.
useHead({ title: 'Accueil' })

const api = useApi()
const { user, can } = useAuth()
const { data: health } = await useAsyncData('health', () => api<HealthDto>('/health').catch(() => null))

const admin = computed(() =>
  [
    { to: '/admin/users', label: 'Utilisateurs', description: 'Rechercher, modifier, changer le rôle ou supprimer un compte.', icon: 'i-lucide-users', show: can('users.read') },
    { to: '/admin/roles', label: 'Droits', description: 'Choisir ce que chaque rôle peut faire.', icon: 'i-lucide-shield', show: can('roles.read') },
  ].filter((link) => link.show),
)
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-highlighted text-2xl font-bold tracking-tight">Bonjour {{ user?.firstName }}</h1>
      <p class="text-muted mt-1">Bienvenue sur {{ APP_NAME }}.</p>
    </div>

    <div class="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2">
      <UCard>
        <template #header>
          <h2 class="text-highlighted font-semibold">Ton compte</h2>
        </template>
        <dl class="space-y-3 text-sm">
          <div class="flex justify-between gap-4">
            <dt class="text-muted">Email</dt>
            <dd class="text-highlighted truncate font-medium">{{ user?.email }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-muted">Rôle</dt>
            <dd class="text-highlighted font-medium">{{ user && ROLE_LABELS[user.role] }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt class="text-muted">Double authentification</dt>
            <dd>
              <UBadge v-if="user?.twoFactorEnabled" label="Active" color="success" variant="subtle" icon="i-lucide-shield-check" />
              <UBadge v-else label="Inactive" color="warning" variant="subtle" icon="i-lucide-shield-alert" />
            </dd>
          </div>
        </dl>
        <template #footer>
          <UButton :label="user?.twoFactorEnabled ? 'Gérer mon profil' : 'Activer la double authentification'" to="/profile" icon="i-lucide-user-round" variant="soft" />
        </template>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-highlighted font-semibold">État du service</h2>
        </template>
        <div class="flex items-center gap-3 text-sm">
          <UIcon :name="health?.database ? 'i-lucide-circle-check' : 'i-lucide-circle-x'" class="size-5" :class="health?.database ? 'text-success' : 'text-error'" />
          <span class="text-toned">{{ health?.database ? 'API et base de données joignables.' : 'API ou base de données injoignable.' }}</span>
        </div>
      </UCard>
    </div>

    <section v-if="admin.length">
      <h2 class="text-highlighted mb-4 font-semibold">Administration</h2>
      <div class="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
        <ULink v-for="link in admin" :key="link.to" :to="link.to" class="border-default hover:bg-elevated flex items-start gap-4 rounded-lg border p-4 transition-colors">
          <UIcon :name="link.icon" class="text-primary mt-0.5 size-6 shrink-0" />
          <span>
            <span class="text-highlighted block font-medium">{{ link.label }}</span>
            <span class="text-muted block text-sm">{{ link.description }}</span>
          </span>
        </ULink>
      </div>
    </section>
  </div>
</template>
