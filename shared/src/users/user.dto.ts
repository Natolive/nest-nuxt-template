import type { Permission, Role } from '../roles/permissions.ts'

// Personne connectée, telle que renvoyée par l'API (jamais le hash du mot de passe), avec ses droits effectifs.
export interface UserDto {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  // Double authentification active : un code est demandé à la connexion.
  twoFactorEnabled: boolean
  permissions: Permission[]
}
