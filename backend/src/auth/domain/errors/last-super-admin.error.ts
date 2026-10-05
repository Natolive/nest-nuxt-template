import { ForbiddenError } from '../../../common/domain/errors/forbidden.error.js';

export class LastSuperAdminError extends ForbiddenError {
  constructor() {
    super('Tu es le seul super admin : nomme quelqu’un d’autre super admin avant de supprimer ton compte.');
  }
}
