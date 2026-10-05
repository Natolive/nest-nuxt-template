import { Injectable } from '@nestjs/common';
import type { LoginTwoFactorDto } from '@socle/shared';
import { UserRepository } from '../../users/domain/user.repository.js';
import { InvalidTwoFactorCodeError } from '../domain/errors/invalid-two-factor-code.error.js';
import { TwoFactorChallengeExpiredError } from '../domain/errors/two-factor-challenge-expired.error.js';
import { checkSecondFactor } from './check-second-factor.js';
import { OpenSessionService } from './open-session.service.js';
import type { OpenedSession } from './opened-session.js';
import { TwoFactorChallenges } from './two-factor-challenges.js';

// Deuxième étape de la connexion : code de l'application ou code de secours (alors consommé).
@Injectable()
export class LoginTwoFactorService {
  constructor(
    private readonly users: UserRepository,
    private readonly challenges: TwoFactorChallenges,
    private readonly openSession: OpenSessionService,
  ) {}

  async execute({ challenge, code }: LoginTwoFactorDto): Promise<OpenedSession> {
    const { userId, remember } = this.challenges.attempt(challenge);
    const user = await this.users.findById(userId);
    if (!user?.twoFactorEnabledAt) throw new TwoFactorChallengeExpiredError();
    const remaining = checkSecondFactor(user, code);
    if (!remaining) throw new InvalidTwoFactorCodeError();
    this.challenges.resolve(challenge);
    if (remaining.length !== user.recoveryCodeHashes.length) await this.users.update(user.id, { recoveryCodeHashes: remaining });
    return this.openSession.execute(user, remember);
  }
}
