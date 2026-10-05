import { DomainError } from '../../../common/domain/errors/domain.error.js';

export class TwoFactorNotEnabledError extends DomainError {
  constructor() {
    super("La double authentification n'est pas active sur ce compte.");
  }
}
