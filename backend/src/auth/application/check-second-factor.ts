import type { User } from '../../users/domain/user.entity.js';
import { hashToken } from './hash-token.js';
import { verifyTotp } from './totp.js';

// Code de l'application (6 chiffres) ou code de secours ; un code de secours utilisé est retiré.
// Renvoie les codes de secours restants si le code est bon, null sinon.
export function checkSecondFactor(user: User, code: string, now = Date.now()): string[] | null {
  if (/^\d{6}$/.test(code)) return user.totpSecret && verifyTotp(user.totpSecret, code, now) ? user.recoveryCodeHashes : null;
  const hash = hashToken(code.replace('-', ''));
  return user.recoveryCodeHashes.includes(hash) ? user.recoveryCodeHashes.filter((h) => h !== hash) : null;
}
