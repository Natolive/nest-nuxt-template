<script setup lang="ts">
import { loginSchema, loginTwoFactorSchema, type LoginDto, type LoginTwoFactorDto, type LoginTwoFactorInput } from '@socle/shared'
import type { FormFieldConfig } from '~/types/form'

definePageMeta({ layout: 'auth', guest: true })
useHead({ title: 'Connexion' })

const state = ref<LoginDto>({ email: '', password: '', remember: true })
const fields: FormFieldConfig<LoginDto>[] = [
  { name: 'email', label: 'Email', type: 'email', autocomplete: 'email', icon: 'i-lucide-mail' },
  { name: 'password', label: 'Mot de passe', type: 'password', autocomplete: 'current-password' },
  { name: 'remember', label: 'Rester connecté', type: 'checkbox' },
]

// Deuxième étape si la double authentification est active : code de l'application ou code de secours.
const codeState = ref<LoginTwoFactorInput>({ challenge: '', code: '' })
const codeFields: FormFieldConfig<LoginTwoFactorInput>[] = [
  {
    name: 'code',
    label: 'Code de vérification',
    autocomplete: 'one-time-code',
    inputmode: 'numeric',
    placeholder: '123 456',
    icon: 'i-lucide-shield-check',
    help: 'Les 6 chiffres de ton application d’authentification, ou un code de secours.',
  },
]

const toast = useToast()
const { login, loginTwoFactor } = useAuth()

async function onLogin(data: LoginDto) {
  let challenge: string | null
  try {
    challenge = await login(data)
  } catch (e) {
    toast.add({ title: 'Connexion impossible', description: apiErrorMessage(e), color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }
  if (challenge) codeState.value = { challenge, code: '' }
  else await navigateTo('/')
}

async function onCode(data: LoginTwoFactorDto) {
  try {
    await loginTwoFactor(data)
  } catch (e) {
    toast.add({ title: 'Code refusé', description: apiErrorMessage(e), color: 'error', icon: 'i-lucide-circle-alert' })
    // Vérification expirée ou trop d'essais : retour au mot de passe.
    if ((e as { statusCode?: number }).statusCode === 401) codeState.value = { challenge: '', code: '' }
    return
  }
  await navigateTo('/')
}
</script>

<template>
  <div>
    <template v-if="codeState.challenge">
      <h1 class="text-highlighted text-3xl font-bold tracking-tight">Vérification</h1>
      <p class="text-muted mt-3">La double authentification est active : saisis le code affiché par ton application.</p>
      <FormBuilder v-model:state="codeState" :schema="loginTwoFactorSchema" :fields="codeFields" :submit="onCode" submit-label="Vérifier" class="mt-10" />
      <UButton label="Revenir au mot de passe" icon="i-lucide-arrow-left" color="neutral" variant="ghost" class="mt-4" @click="codeState = { challenge: '', code: '' }" />
    </template>
    <template v-else>
      <h1 class="text-highlighted text-3xl font-bold tracking-tight">Connexion</h1>
      <p class="text-muted mt-3">Content de te revoir.</p>
      <FormBuilder v-model:state="state" :schema="loginSchema" :fields="fields" :submit="onLogin" submit-label="Se connecter" class="mt-10">
        <template #hint-password>
          <ULink to="/forgot-password" class="text-primary text-sm font-medium">Mot de passe oublié ?</ULink>
        </template>
      </FormBuilder>
      <p class="text-muted mt-8 text-sm">
        Pas encore de compte ?
        <ULink to="/signup" class="text-primary font-medium">Créer un compte</ULink>
      </p>
    </template>
  </div>
</template>
