import type { SignupDto } from '@socle/shared';
import { AuthenticateService } from '@src/auth/application/authenticate.service.js';
import { BuildAuthenticatedUserService } from '@src/auth/application/build-authenticated-user.service.js';
import { ChangePasswordService } from '@src/auth/application/change-password.service.js';
import { DeleteAccountService } from '@src/auth/application/delete-account.service.js';
import { DisableTwoFactorService } from '@src/auth/application/disable-two-factor.service.js';
import { EnableTwoFactorService } from '@src/auth/application/enable-two-factor.service.js';
import { ForgotPasswordService } from '@src/auth/application/forgot-password.service.js';
import { LoginTwoFactorService } from '@src/auth/application/login-two-factor.service.js';
import { LoginService } from '@src/auth/application/login.service.js';
import { LogoutService } from '@src/auth/application/logout.service.js';
import { OpenSessionService } from '@src/auth/application/open-session.service.js';
import type { OpenedSession } from '@src/auth/application/opened-session.js';
import { ResetPasswordService } from '@src/auth/application/reset-password.service.js';
import { SetupTwoFactorService } from '@src/auth/application/setup-two-factor.service.js';
import { SignupService } from '@src/auth/application/signup.service.js';
import { totp } from '@src/auth/application/totp.js';
import { TwoFactorChallenges } from '@src/auth/application/two-factor-challenges.js';
import { UpdateProfileService } from '@src/auth/application/update-profile.service.js';
import { VerifyEmailService } from '@src/auth/application/verify-email.service.js';
import { RolePermissionsService } from '@src/roles/application/role-permissions.service.js';
import { FakeMailer } from '@test/fakes/fake-mailer.js';
import { FakePasswordHasher } from '@test/fakes/fake-password-hasher.js';
import { InMemoryRolePermissionRepository } from '@test/fakes/in-memory-role-permission.repository.js';
import { InMemorySessionRepository } from '@test/fakes/in-memory-session.repository.js';
import { InMemoryUserRepository } from '@test/fakes/in-memory-user.repository.js';

export const dto: SignupDto = { firstName: 'Léa', lastName: 'Dupont', email: 'lea@exemple.fr', password: '12345678' };
export const credentials = { email: dto.email, password: dto.password };

// Résultat d'une connexion sans 2FA : la session ouverte.
export function opened(result: OpenedSession | { challenge: string }): OpenedSession {
  if ('challenge' in result) throw new Error('2FA demandée');
  return result;
}

// Cas d'usage d'auth câblés sur des fakes en mémoire : les parcours s'enchaînent comme en vrai.
export async function setupAuth() {
  const users = new InMemoryUserRepository();
  const sessions = new InMemorySessionRepository();
  const mailer = new FakeMailer();
  const hasher = new FakePasswordHasher();
  const challenges = new TwoFactorChallenges();
  const buildAuthenticatedUser = new BuildAuthenticatedUserService(new RolePermissionsService(new InMemoryRolePermissionRepository()));
  const openSession = new OpenSessionService(sessions, buildAuthenticatedUser);

  const signup = new SignupService(users, hasher, mailer);
  const verifyEmail = new VerifyEmailService(users, hasher, openSession);
  const login = new LoginService(users, hasher, openSession, challenges);
  const setupTwoFactor = new SetupTwoFactorService(users);
  const enableTwoFactor = new EnableTwoFactorService(users);
  // Ouvre le dernier lien envoyé, avec le mot de passe saisi sur la page de confirmation.
  const confirm = (password = dto.password, token = mailer.lastToken()) => verifyEmail.execute({ token, password });
  // Compte inscrit, confirmé et connecté.
  const loggedIn = async () => {
    await signup.execute(dto);
    await confirm();
    return opened(await login.execute(credentials));
  };

  return {
    users,
    sessions,
    mailer,
    challenges,
    signup,
    verifyEmail,
    confirm,
    login,
    loggedIn,
    loginTwoFactor: new LoginTwoFactorService(users, challenges, openSession),
    forgotPassword: new ForgotPasswordService(users, mailer),
    resetPassword: new ResetPasswordService(users, hasher, sessions),
    logout: new LogoutService(sessions),
    authenticate: new AuthenticateService(sessions, users, buildAuthenticatedUser),
    updateProfile: new UpdateProfileService(users, buildAuthenticatedUser),
    changePassword: new ChangePasswordService(users, hasher, sessions),
    deleteAccount: new DeleteAccountService(users, hasher),
    setupTwoFactor,
    enableTwoFactor,
    disableTwoFactor: new DisableTwoFactorService(users, hasher),
    // Compte connecté avec 2FA active : sa clé et ses codes de secours.
    withTwoFactor: async () => {
      const { user } = await loggedIn();
      const { secret } = await setupTwoFactor.execute(user);
      const { recoveryCodes } = await enableTwoFactor.execute(user, { code: totp(secret) });
      return { user, secret, recoveryCodes };
    },
  };
}
