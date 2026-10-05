import { Injectable } from '@nestjs/common';
import type { ManagedUserDto } from '@socle/shared';
import { orThrow } from '../../common/application/or-throw.js';
import { UserNotFoundError } from '../domain/errors/user-not-found.error.js';
import type { PublicUser } from '../domain/public-user.entity.js';
import { toManagedUser } from '../domain/to-managed-user.js';
import { UserRepository } from '../domain/user.repository.js';
import { findManageableUser } from './find-manageable-user.js';

// Téléphone et codes de secours perdus : un admin coupe la 2FA, la personne se reconnecte avec son mot de passe
// puis la réactive. Pas sur son propre compte (il passe par « Mon profil », code à l'appui).
@Injectable()
export class ResetUserTwoFactorService {
  constructor(private readonly users: UserRepository) {}

  async execute(actor: PublicUser, id: string): Promise<ManagedUserDto> {
    await findManageableUser(this.users, actor, id, { self: false });
    return toManagedUser(
      orThrow(await this.users.update(id, { totpSecret: null, twoFactorEnabledAt: null, recoveryCodeHashes: [] }), UserNotFoundError),
    );
  }
}
