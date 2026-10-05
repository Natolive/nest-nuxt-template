import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { TwoFactorChallengeExpiredError } from '../domain/errors/two-factor-challenge-expired.error.js';
import { hashToken } from './hash-token.js';

const TTL = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

interface Challenge {
  userId: string;
  remember: boolean;
  expiresAt: number;
  attempts: number;
}

// Connexions en attente du code 2FA : mot de passe vérifié, session pas encore ouverte.
// Jeton haché, 5 minutes, 5 essais au plus.
// ponytail: en mémoire, par processus (perdu au redémarrage : il suffit de se reconnecter) ; en base si plusieurs instances de l'API.
@Injectable()
export class TwoFactorChallenges {
  private readonly pending = new Map<string, Challenge>();

  issue(userId: string, remember: boolean, now = Date.now()): string {
    for (const [key, c] of this.pending) if (c.expiresAt <= now) this.pending.delete(key);
    const token = randomBytes(32).toString('base64url');
    this.pending.set(hashToken(token), { userId, remember, expiresAt: now + TTL, attempts: 0 });
    return token;
  }

  // Compte un essai ; jeton inconnu, expiré ou épuisé = reconnexion.
  attempt(token: string, now = Date.now()): Challenge {
    const key = hashToken(token);
    const challenge = this.pending.get(key);
    if (!challenge || challenge.expiresAt <= now || challenge.attempts >= MAX_ATTEMPTS) {
      this.pending.delete(key);
      throw new TwoFactorChallengeExpiredError();
    }
    challenge.attempts++;
    return challenge;
  }

  resolve(token: string): void {
    this.pending.delete(hashToken(token));
  }
}
