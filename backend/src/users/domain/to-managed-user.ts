import type { ManagedUserDto } from '@socle/shared';
import { toPublicUser } from './to-public-user.js';
import type { User } from './user.entity.js';

export const toManagedUser = (user: User): ManagedUserDto => ({
  ...toPublicUser(user),
  extraPermissions: user.extraPermissions,
  emailVerified: !!user.emailVerifiedAt,
  twoFactorEnabled: !!user.twoFactorEnabledAt,
  createdAt: user.createdAt.toISOString(),
});
