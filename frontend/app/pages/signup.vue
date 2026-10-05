<script setup lang="ts">
import { PASSWORD_MIN, signupSchema, type SignupDto } from '@socle/shared'
import type { FormFieldConfig } from '~/types/form'

definePageMeta({ layout: 'auth', guest: true })
useHead({ title: 'Créer un compte' })

const state = ref<SignupDto>({ firstName: '', lastName: '', email: '', password: '' })
const fields: FormFieldConfig<SignupDto>[] = [
  { name: 'firstName', label: 'Prénom', autocomplete: 'given-name', half: true },
  { name: 'lastName', label: 'Nom', autocomplete: 'family-name', half: true },
  { name: 'email', label: 'Email', type: 'email', autocomplete: 'email', icon: 'i-lucide-mail' },
  { name: 'password', label: 'Mot de passe', type: 'password', autocomplete: 'new-password', help: `${PASSWORD_MIN} caractères minimum.` },
]

const toast = useToast()
const { signup } = useAuth()
// Email auquel le lien de confirmation a été envoyé.
const sentTo = ref<string>()

async function submit(data: SignupDto) {
  try {
    await signup(data)
  } catch (e) {
    toast.add({ title: 'Création du compte impossible', description: apiErrorMessage(e), color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }
  toast.add({ title: 'Compte créé', description: 'Confirme ton email pour te connecter.', color: 'success', icon: 'i-lucide-check' })
  sentTo.value = data.email
}
</script>

<template>
  <div>
    <template v-if="sentTo">
      <h1 class="text-highlighted text-3xl font-bold tracking-tight">Vérifie tes mails</h1>
      <p class="text-muted mt-3">
        On t’a envoyé un lien à <span class="text-highlighted font-medium">{{ sentTo }}</span> : ouvre-le pour activer ton compte.
        Rien reçu ? Regarde dans les spams, ou recommence l’inscription pour recevoir un nouveau lien.
      </p>
      <UButton label="Recommencer l’inscription" variant="soft" icon="i-lucide-rotate-ccw" class="mt-8" @click="sentTo = undefined" />
    </template>
    <template v-else>
      <h1 class="text-highlighted text-3xl font-bold tracking-tight">Créer un compte</h1>
      <p class="text-muted mt-3">Quelques infos, puis un lien à confirmer par email.</p>
      <FormBuilder v-model:state="state" :schema="signupSchema" :fields="fields" :submit="submit" submit-label="Créer mon compte" class="mt-10" />
      <p class="text-muted mt-8 text-sm">
        Déjà un compte ?
        <ULink to="/login" class="text-primary font-medium">Se connecter</ULink>
      </p>
    </template>
  </div>
</template>
