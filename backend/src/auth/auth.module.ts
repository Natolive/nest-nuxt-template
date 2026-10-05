import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MailModule } from '../mail/mail.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthenticateService } from './application/authenticate.service.js';
import { BuildAuthenticatedUserService } from './application/build-authenticated-user.service.js';
import { ChangePasswordService } from './application/change-password.service.js';
import { DeleteAccountService } from './application/delete-account.service.js';
import { DisableTwoFactorService } from './application/disable-two-factor.service.js';
import { EnableTwoFactorService } from './application/enable-two-factor.service.js';
import { ForgotPasswordService } from './application/forgot-password.service.js';
import { LoginTwoFactorService } from './application/login-two-factor.service.js';
import { LoginService } from './application/login.service.js';
import { LogoutService } from './application/logout.service.js';
import { OpenSessionService } from './application/open-session.service.js';
import { ResetPasswordService } from './application/reset-password.service.js';
import { SetupTwoFactorService } from './application/setup-two-factor.service.js';
import { SignupService } from './application/signup.service.js';
import { TwoFactorChallenges } from './application/two-factor-challenges.js';
import { UpdateProfileService } from './application/update-profile.service.js';
import { VerifyEmailService } from './application/verify-email.service.js';
import { PasswordHasher } from './domain/password-hasher.js';
import { SessionRepository } from './domain/session.repository.js';
import { DrizzleSessionRepository } from './infrastructure/drizzle-session.repository.js';
import { AuthController } from './infrastructure/http/auth.controller.js';
import { SessionGuard } from './infrastructure/http/session.guard.js';
import { ScryptPasswordHasher } from './infrastructure/scrypt-password-hasher.js';

@Module({
  imports: [UsersModule, RolesModule, MailModule],
  controllers: [AuthController],
  providers: [
    AuthenticateService,
    BuildAuthenticatedUserService,
    ChangePasswordService,
    DeleteAccountService,
    DisableTwoFactorService,
    EnableTwoFactorService,
    ForgotPasswordService,
    LoginService,
    LoginTwoFactorService,
    LogoutService,
    OpenSessionService,
    ResetPasswordService,
    SetupTwoFactorService,
    SignupService,
    TwoFactorChallenges,
    UpdateProfileService,
    VerifyEmailService,
    // Global : `@Authorize(...)` suffit sur une route de n'importe quel module.
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: PasswordHasher, useClass: ScryptPasswordHasher },
    { provide: SessionRepository, useClass: DrizzleSessionRepository },
  ],
})
export class AuthModule {}
