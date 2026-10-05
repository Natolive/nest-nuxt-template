import { Injectable } from '@nestjs/common';
import type { EnableTwoFactorDto, RecoveryCodesDto, UserDto } from '@socle/shared';
import { randomBytes } from 'node:crypto';
import { orThrow } from '../../common/application/or-throw.js';
import { UserNotFoundError } from '../../users/domain/errors/user-not-found.error.js';
import { UserRepository } from '../../users/domain/user.repository.js';
import { InvalidTwoFactorCodeError } from '../domain/errors/invalid-two-factor-code.error.js';
import { TwoFactorAlreadyEnabledError } from '../domain/errors/two-factor-already-enabled.error.js';
import { TwoFactorNotSetUpError } from '../domain/errors/two-factor-not-set-up.error.js';
import { hashToken } from './hash-token.js';
import { toBase32, verifyTotp } from './totp.js';

const RECOVERY_CODES = 8;

// Premier code bon = l'application est bien configurée : 2FA active, codes de secours remis une seule fois.
@Injectable()
export class EnableTwoFactorService {
  constructor(private readonly users: UserRepository) {}

  async execute(user: UserDto, { code }: EnableTwoFactorDto): Promise<RecoveryCodesDto> {
    const { totpSecret, twoFactorEnabledAt } = orThrow(await this.users.findById(user.id), UserNotFoundError);
    if (twoFactorEnabledAt) throw new TwoFactorAlreadyEnabledError();
    if (!totpSecret) throw new TwoFactorNotSetUpError();
    if (!verifyTotp(totpSecret, code)) throw new InvalidTwoFactorCodeError();
    // « ABCD-EFGH » : 8 caractères base32 (40 bits) par code.
    const codes = Array.from({ length: RECOVERY_CODES }, () => toBase32(randomBytes(5)));
    await this.users.update(user.id, { twoFactorEnabledAt: new Date(), recoveryCodeHashes: codes.map(hashToken) });
    return { recoveryCodes: codes.map((c) => `${c.slice(0, 4)}-${c.slice(4)}`) };
  }
}
