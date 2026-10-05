import { Injectable } from '@nestjs/common';
import { PERMISSIONS, type UserDto } from '@socle/shared';
import { RolePermissionsService } from '../../roles/application/role-permissions.service.js';
import { toPublicUser } from '../../users/domain/to-public-user.js';
import type { User } from '../../users/domain/user.entity.js';

// Personne connectée renvoyée au front, avec ses droits effectifs : ceux du rôle plus ceux ajoutés à la personne.
@Injectable()
export class BuildAuthenticatedUserService {
  constructor(private readonly rolePermissions: RolePermissionsService) {}

  async execute(user: User): Promise<UserDto> {
    const fromRole = await this.rolePermissions.execute(user.role);
    const permissions = PERMISSIONS.filter((p) => fromRole.includes(p) || user.extraPermissions.includes(p));
    return { ...toPublicUser(user), twoFactorEnabled: user.twoFactorEnabledAt !== null, permissions };
  }
}
