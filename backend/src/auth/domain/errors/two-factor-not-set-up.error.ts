import { DomainError } from '../../../common/domain/errors/domain.error.js';

export class TwoFactorNotSetUpError extends DomainError {
  constructor() {
    super("Commence par « Activer la double authentification » pour obtenir le QR code.");
  }
}
