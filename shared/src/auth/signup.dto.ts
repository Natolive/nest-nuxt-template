import type { z } from 'zod'
import { accountSchema } from '../users/account.dto.ts'

// Inscription : compte inactif tant que l'email n'est pas confirmé par le lien reçu.
export const signupSchema = accountSchema
export type SignupDto = z.infer<typeof signupSchema>
