// Un droit par action protégée de l'API, nommé `<catégorie>.<action>` ; nouvelle action = nouveau droit ici, avec son libellé.
// Ce qui concerne son propre compte (profil, mot de passe, 2FA) demande seulement d'être connecté, sans droit.
export const PERMISSIONS = [
  'roles.read',
  'roles.update',
  'users.read',
  'users.update',
  'users.update_role',
  'users.update_permissions',
  'users.reset_two_factor',
  'users.delete',
] as const
export type Permission = (typeof PERMISSIONS)[number]

export const PERMISSION_LABELS: Record<Permission, string> = {
  'roles.read': 'Voir les rôles et leurs droits',
  'roles.update': 'Modifier les droits des rôles',
  'users.read': 'Voir les utilisateurs',
  'users.update': 'Modifier le nom et l’email des utilisateurs',
  'users.update_role': 'Changer le rôle des utilisateurs',
  'users.update_permissions': 'Ajouter des droits aux utilisateurs',
  'users.reset_two_factor': 'Désactiver la double authentification d’un utilisateur (téléphone perdu)',
  'users.delete': 'Supprimer des utilisateurs',
}

// Catégorie = préfixe du droit (`users.read` → `users`) : un nouveau préfixe oblige à lui donner un libellé.
export type PermissionCategory = Permission extends `${infer C}.${string}` ? C : never

export const PERMISSION_CATEGORY_LABELS: Record<PermissionCategory, string> = {
  roles: 'Rôles et droits',
  users: 'Utilisateurs',
}

export const PERMISSION_CATEGORIES = (Object.keys(PERMISSION_CATEGORY_LABELS) as PermissionCategory[]).map((category) => ({
  category,
  label: PERMISSION_CATEGORY_LABELS[category],
  permissions: PERMISSIONS.filter((p) => p.startsWith(`${category}.`)),
}))

// Ordre croissant de pouvoir (sert aussi au tri de la liste des utilisateurs).
export const ROLES = ['user', 'admin', 'super_admin'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = { user: 'Utilisateur', admin: 'Admin', super_admin: 'Super admin' }

// Droits par défaut, tant qu'un admin ne les a pas modifiés (écran « Droits ») : user n'administre rien,
// admin gère les comptes sans toucher aux rôles ni aux droits, super_admin a tout (et le garde toujours).
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  user: [],
  admin: ['users.read', 'users.update', 'users.reset_two_factor'],
  super_admin: PERMISSIONS,
}
