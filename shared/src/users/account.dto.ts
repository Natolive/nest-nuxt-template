import { z } from 'zod'
import { emailField } from '../common/email.field.ts'
import { newPasswordField } from '../common/new-password.field.ts'

// Un compte : inscription, création en ligne de commande ; les autres schémas en reprennent une partie.
export const accountSchema = z.object({
  firstName: z.string('Saisis ton prénom.').trim().min(1, 'Saisis ton prénom.').max(100, 'Raccourcis le prénom à 100 caractères.'),
  lastName: z.string('Saisis ton nom.').trim().min(1, 'Saisis ton nom.').max(100, 'Raccourcis le nom à 100 caractères.'),
  email: emailField,
  password: newPasswordField,
})
export type AccountDto = z.infer<typeof accountSchema>
