import type { User } from './user.entity.js';

// Facultatifs à la création : `user`, aucun droit en plus, email pas confirmé, 2FA inactive (défauts de la base).
type Defaulted =
  | 'role'
  | 'extraPermissions'
  | 'emailVerifiedAt'
  | 'emailVerificationTokenHash'
  | 'emailVerificationExpiresAt'
  | 'passwordResetTokenHash'
  | 'passwordResetExpiresAt'
  | 'totpSecret'
  | 'twoFactorEnabledAt'
  | 'recoveryCodeHashes';
export type NewUser = Omit<User, 'id' | 'createdAt' | Defaulted> & Partial<Pick<User, Defaulted>>;
