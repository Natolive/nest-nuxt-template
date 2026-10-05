import { z } from 'zod'
import { newPasswordField } from '../common/new-password.field.ts'

// Jeton du lien reçu par email, et nouveau mot de passe. Ne connecte pas : la connexion qui suit demande le code 2FA s'il est actif.
export const resetPasswordSchema = z.object({
  token: z.string('Ouvre le lien reçu par email.').min(1, 'Ouvre le lien reçu par email.').max(100),
  password: newPasswordField,
})
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>
