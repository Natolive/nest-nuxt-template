import { Injectable } from '@nestjs/common';
import type { ResetPasswordDto } from '@socle/shared';
import { UserRepository } from '../../users/domain/user.repository.js';
import { InvalidResetLinkError } from '../domain/errors/invalid-reset-link.error.js';
import { PasswordHasher } from '../domain/password-hasher.js';
import { SessionRepository } from '../domain/session.repository.js';
import { hashToken } from './hash-token.js';

@Injectable()
export class ResetPasswordService {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly sessions: SessionRepository,
  ) {}

  // Le lien prouve la boîte mail : il confirme aussi l'email d'un compte pas encore confirmé.
  // Déconnecte partout (mot de passe peut-être compromis) sans ouvrir de session : la connexion qui suit
  // demande le code 2FA s'il est actif, une boîte mail piratée ne suffit pas.
  async execute({ token, password }: ResetPasswordDto): Promise<void> {
    const found = await this.users.findByPasswordResetTokenHash(hashToken(token));
    if (!found || found.passwordResetExpiresAt! <= new Date()) throw new InvalidResetLinkError();
    await this.users.update(found.id, {
      passwordHash: await this.hasher.hash(password),
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      emailVerifiedAt: found.emailVerifiedAt ?? new Date(),
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
    });
    await this.sessions.deleteByUserId(found.id);
  }
}
