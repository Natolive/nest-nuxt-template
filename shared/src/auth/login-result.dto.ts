import type { UserDto } from '../users/user.dto.ts'

// Connexion faite (`user`), ou code 2FA attendu (`challenge` à renvoyer avec le code).
export type LoginResultDto = { user: UserDto, challenge?: never } | { challenge: string, user?: never }
