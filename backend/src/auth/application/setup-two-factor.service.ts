import { Injectable } from '@nestjs/common';
import type { TwoFactorSetupDto, UserDto } from '@socle/shared';
import { UserRepository } from '../../users/domain/user.repository.js';
import { TwoFactorAlreadyEnabledError } from '../domain/errors/two-factor-already-enabled.error.js';
import { newTotpSecret, otpauthUrl } from './totp.js';

// Nouvelle clé à scanner ; la 2FA ne s'active qu'une fois un premier code confirmé (EnableTwoFactorService).
@Injectable()
export class SetupTwoFactorService {
  constructor(private readonly users: UserRepository) {}

  async execute(user: UserDto): Promise<TwoFactorSetupDto> {
    if (user.twoFactorEnabled) throw new TwoFactorAlreadyEnabledError();
    const secret = newTotpSecret();
    await this.users.update(user.id, { totpSecret: secret });
    return { secret, otpauthUrl: otpauthUrl(secret, user.email) };
  }
}
