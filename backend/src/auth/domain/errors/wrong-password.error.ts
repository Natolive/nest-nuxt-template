import { DomainError } from '../../../common/domain/errors/domain.error.js';

// Mot de passe actuel redemandé pour une action sensible (changer de mot de passe, couper la 2FA, supprimer son compte).
// 400 et non 401 : la session reste valable, seule la saisie est fausse.
export class WrongPasswordError extends DomainError {
  constructor() {
    super("Ce n'est pas ton mot de passe actuel : ressaisis-le, ou passe par « Mot de passe oublié » depuis la connexion.");
  }
}
