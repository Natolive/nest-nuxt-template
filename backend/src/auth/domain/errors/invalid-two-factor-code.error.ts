import { DomainError } from '../../../common/domain/errors/domain.error.js';

export class InvalidTwoFactorCodeError extends DomainError {
  constructor() {
    super("Code incorrect ou expiré : saisis le code affiché maintenant par ton application, ou un code de secours.");
  }
}
