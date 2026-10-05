import { Injectable } from '@nestjs/common';
import type { DisableTwoFactorDto, UserDto } from '@socle/shared';
import { orThrow } from '../../common/application/or-throw.js';
import { UserNotFoundError } from '../../users/domain/errors/user-not-found.error.js';
import { UserRepository } from '../../users/domain/user.repository.js';
import { InvalidTwoFactorCodeError } from '../domain/errors/invalid-two-factor-code.error.js';
import { TwoFactorNotEnabledError } from '../domain/errors/two-factor-not-enabled.error.js';
import { WrongPasswordError } from '../domain/errors/wrong-password.error.js';
import { PasswordHasher } from '../domain/password-hasher.js';
import { checkSecondFactor } from './check-second-factor.js';

// Désactivation : mot de passe + code (application ou secours), pour qu'une session volée ne suffise pas.
@Injectable()
export class DisableTwoFactorService {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(user: UserDto, { password, code }: DisableTwoFactorDto): Promise<void> {
    const found = orThrow(await this.users.findById(user.id), UserNotFoundError);
    if (!found.twoFactorEnabledAt) throw new TwoFactorNotEnabledError();
    if (!(await this.hasher.verify(password, found.passwordHash))) throw new WrongPasswordError();
    if (!checkSecondFactor(found, code)) throw new InvalidTwoFactorCodeError();
    await this.users.update(user.id, { totpSecret: null, twoFactorEnabledAt: null, recoveryCodeHashes: [] });
  }
}
