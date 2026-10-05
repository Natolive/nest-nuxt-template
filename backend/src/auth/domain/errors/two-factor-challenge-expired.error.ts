import { UnauthorizedError } from '../../../common/domain/errors/unauthorized.error.js';

export class TwoFactorChallengeExpiredError extends UnauthorizedError {
  constructor() {
    super('La vérification a expiré ou a échoué trop de fois : reconnecte-toi avec ton mot de passe.');
  }
}
