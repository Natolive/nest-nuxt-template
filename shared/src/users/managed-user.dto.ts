import type { Permission, Role } from '../roles/permissions.ts'

// Utilisateur vu depuis l'administration : son rôle, les droits ajoutés à ceux du rôle et l'état de son compte.
export interface ManagedUserDto {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  extraPermissions: Permission[]
  emailVerified: boolean
  twoFactorEnabled: boolean
  // Date d'inscription, ISO 8601.
  createdAt: string
}
