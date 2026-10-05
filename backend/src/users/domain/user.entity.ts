import type { Permission, Role } from '@socle/shared';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  role: Role;
  extraPermissions: Permission[];
  emailVerifiedAt: Date | null;
  emailVerificationTokenHash: string | null;
  emailVerificationExpiresAt: Date | null;
  passwordResetTokenHash: string | null;
  passwordResetExpiresAt: Date | null;
  totpSecret: string | null;
  twoFactorEnabledAt: Date | null;
  recoveryCodeHashes: string[];
  createdAt: Date;
}
