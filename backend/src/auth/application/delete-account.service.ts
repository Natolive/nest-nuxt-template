import { Injectable } from '@nestjs/common';
import type { DeleteAccountDto, UserDto } from '@socle/shared';
import { orThrow } from '../../common/application/or-throw.js';
import { UserNotFoundError } from '../../users/domain/errors/user-not-found.error.js';
import { UserRepository } from '../../users/domain/user.repository.js';
import { LastSuperAdminError } from '../domain/errors/last-super-admin.error.js';
import { WrongPasswordError } from '../domain/errors/wrong-password.error.js';
import { PasswordHasher } from '../domain/password-hasher.js';

// Suppression de son propre compte, mot de passe à l'appui ; ses sessions partent avec lui (cascade en base).
@Injectable()
export class DeleteAccountService {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(user: UserDto, { password }: DeleteAccountDto): Promise<void> {
    const found = orThrow(await this.users.findById(user.id), UserNotFoundError);
    if (!(await this.hasher.verify(password, found.passwordHash))) throw new WrongPasswordError();
    // Sans super admin, plus personne ne peut gérer les rôles ni les droits.
    if (found.role === 'super_admin') {
      const { total } = await this.users.count({ terms: [], roles: ['super_admin'], emailVerified: null, withExtraPermissions: null });
      if (total <= 1) throw new LastSuperAdminError();
    }
    await this.users.delete(user.id);
  }
}
