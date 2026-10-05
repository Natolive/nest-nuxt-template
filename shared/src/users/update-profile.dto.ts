import type { z } from 'zod'
import { accountSchema } from './account.dto.ts'

// Ce que la personne modifie elle-même : son nom, pas son email (identifiant confirmé à l'inscription) ni son rôle.
export const updateProfileSchema = accountSchema.pick({ firstName: true, lastName: true })
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>
