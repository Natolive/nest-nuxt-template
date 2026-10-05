import { ConflictError } from '../../../common/domain/errors/conflict.error.js';

export class TwoFactorAlreadyEnabledError extends ConflictError {
  constructor() {
    super('La double authentification est déjà active : désactive-la d’abord pour changer d’application.');
  }
}
