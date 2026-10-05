import { z } from 'zod'

// Suppression de son propre compte : le mot de passe est redemandé, une session restée ouverte ne suffit pas.
export const deleteAccountSchema = z.object({
  password: z.string('Saisis ton mot de passe.').min(1, 'Saisis ton mot de passe.'),
})
export type DeleteAccountDto = z.infer<typeof deleteAccountSchema>
