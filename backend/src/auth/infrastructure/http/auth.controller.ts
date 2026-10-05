import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Req, Res } from '@nestjs/common';
import {
  changePasswordSchema,
  deleteAccountSchema,
  disableTwoFactorSchema,
  enableTwoFactorSchema,
  forgotPasswordSchema,
  loginSchema,
  loginTwoFactorSchema,
  resetPasswordSchema,
  signupSchema,
  updateProfileSchema,
  verifyEmailSchema,
  type ChangePasswordDto,
  type DeleteAccountDto,
  type DisableTwoFactorDto,
  type EnableTwoFactorDto,
  type ForgotPasswordDto,
  type LoginDto,
  type LoginResultDto,
  type LoginTwoFactorDto,
  type RecoveryCodesDto,
  type ResetPasswordDto,
  type SignupDto,
  type TwoFactorSetupDto,
  type UpdateProfileDto,
  type UserDto,
  type VerifyEmailDto,
} from '@socle/shared';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '../../../common/infrastructure/http/pipes/zod-validation.pipe.js';
import { RateLimit } from '../../../common/infrastructure/http/rate-limit.decorator.js';
import { ChangePasswordService } from '../../application/change-password.service.js';
import { DeleteAccountService } from '../../application/delete-account.service.js';
import { DisableTwoFactorService } from '../../application/disable-two-factor.service.js';
import { EnableTwoFactorService } from '../../application/enable-two-factor.service.js';
import { ForgotPasswordService } from '../../application/forgot-password.service.js';
import { LoginTwoFactorService } from '../../application/login-two-factor.service.js';
import { LoginService } from '../../application/login.service.js';
import { LogoutService } from '../../application/logout.service.js';
import { ResetPasswordService } from '../../application/reset-password.service.js';
import { SetupTwoFactorService } from '../../application/setup-two-factor.service.js';
import { SignupService } from '../../application/signup.service.js';
import { UpdateProfileService } from '../../application/update-profile.service.js';
import { VerifyEmailService } from '../../application/verify-email.service.js';
import { Authorize } from './authorize.decorator.js';
import { CurrentUser } from './current-user.decorator.js';
import { clearSessionCookie, readSessionCookie, writeSessionCookie } from './session-cookie.js';

const MINUTE = 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly signupService: SignupService,
    private readonly verifyEmailService: VerifyEmailService,
    private readonly loginService: LoginService,
    private readonly loginTwoFactorService: LoginTwoFactorService,
    private readonly forgotPasswordService: ForgotPasswordService,
    private readonly resetPasswordService: ResetPasswordService,
    private readonly logoutService: LogoutService,
    private readonly updateProfileService: UpdateProfileService,
    private readonly changePasswordService: ChangePasswordService,
    private readonly setupTwoFactorService: SetupTwoFactorService,
    private readonly enableTwoFactorService: EnableTwoFactorService,
    private readonly disableTwoFactorService: DisableTwoFactorService,
    private readonly deleteAccountService: DeleteAccountService,
  ) {}

  // Chaque inscription envoie un mail : protège la boîte visée et le quota d'envoi.
  @Post('signup')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RateLimit({ by: 'email', limit: 3, windowMs: 60 * MINUTE }, { by: 'ip', limit: 30, windowMs: 60 * MINUTE })
  signup(@Body(new ZodValidationPipe(signupSchema)) dto: SignupDto): Promise<void> {
    return this.signupService.execute(dto);
  }

  // Essais de mot de passe par qui a le lien : limite par IP (pas d'email dans le body).
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ by: 'ip', limit: 20, windowMs: 15 * MINUTE })
  async verifyEmail(@Body(new ZodValidationPipe(verifyEmailSchema)) dto: VerifyEmailDto, @Res({ passthrough: true }) res: Response): Promise<UserDto> {
    const session = await this.verifyEmailService.execute(dto);
    writeSessionCookie(res, session);
    return session.user;
  }

  // Essais de mot de passe sur un compte, et depuis une même machine. 2FA active : pas de session, un jeton pour l'étape suivante.
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ by: 'email', limit: 10, windowMs: 15 * MINUTE }, { by: 'ip', limit: 50, windowMs: 15 * MINUTE })
  async login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<LoginResultDto> {
    const result = await this.loginService.execute(dto);
    if ('challenge' in result) return { challenge: result.challenge };
    writeSessionCookie(res, result);
    return { user: result.user };
  }

  // Essais de codes 2FA depuis une même machine (en plus des 5 essais par jeton).
  @Post('login/2fa')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ by: 'ip', limit: 20, windowMs: 15 * MINUTE })
  async loginTwoFactor(
    @Body(new ZodValidationPipe(loginTwoFactorSchema)) dto: LoginTwoFactorDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResultDto> {
    const session = await this.loginTwoFactorService.execute(dto);
    writeSessionCookie(res, session);
    return { user: session.user };
  }

  // Chaque demande envoie un mail, comme l'inscription.
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RateLimit({ by: 'email', limit: 3, windowMs: 60 * MINUTE }, { by: 'ip', limit: 30, windowMs: 60 * MINUTE })
  forgotPassword(@Body(new ZodValidationPipe(forgotPasswordSchema)) dto: ForgotPasswordDto): Promise<void> {
    return this.forgotPasswordService.execute(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RateLimit({ by: 'ip', limit: 20, windowMs: 15 * MINUTE })
  resetPassword(@Body(new ZodValidationPipe(resetPasswordSchema)) dto: ResetPasswordDto): Promise<void> {
    return this.resetPasswordService.execute(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.logoutService.execute(readSessionCookie(req));
    clearSessionCookie(res);
  }

  @Get('me')
  @Authorize()
  me(@CurrentUser() user: UserDto): UserDto {
    return user;
  }

  @Patch('me')
  @Authorize()
  updateProfile(@CurrentUser() user: UserDto, @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDto): Promise<UserDto> {
    return this.updateProfileService.execute(user, dto);
  }

  // Essais du mot de passe actuel : limite par IP, comme les autres routes qui testent un mot de passe.
  @Post('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize()
  @RateLimit({ by: 'ip', limit: 10, windowMs: 15 * MINUTE })
  changePassword(
    @CurrentUser() user: UserDto,
    @Req() req: Request,
    @Body(new ZodValidationPipe(changePasswordSchema)) dto: ChangePasswordDto,
  ): Promise<void> {
    return this.changePasswordService.execute(user, readSessionCookie(req), dto);
  }

  @Post('me/2fa/setup')
  @HttpCode(HttpStatus.OK)
  @Authorize()
  setupTwoFactor(@CurrentUser() user: UserDto): Promise<TwoFactorSetupDto> {
    return this.setupTwoFactorService.execute(user);
  }

  @Post('me/2fa/enable')
  @HttpCode(HttpStatus.OK)
  @Authorize()
  @RateLimit({ by: 'ip', limit: 20, windowMs: 15 * MINUTE })
  enableTwoFactor(@CurrentUser() user: UserDto, @Body(new ZodValidationPipe(enableTwoFactorSchema)) dto: EnableTwoFactorDto): Promise<RecoveryCodesDto> {
    return this.enableTwoFactorService.execute(user, dto);
  }

  @Post('me/2fa/disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize()
  @RateLimit({ by: 'ip', limit: 10, windowMs: 15 * MINUTE })
  disableTwoFactor(@CurrentUser() user: UserDto, @Body(new ZodValidationPipe(disableTwoFactorSchema)) dto: DisableTwoFactorDto): Promise<void> {
    return this.disableTwoFactorService.execute(user, dto);
  }

  // Le cookie est effacé : le compte et ses sessions n'existent plus.
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize()
  @RateLimit({ by: 'ip', limit: 10, windowMs: 15 * MINUTE })
  async deleteAccount(
    @CurrentUser() user: UserDto,
    @Body(new ZodValidationPipe(deleteAccountSchema)) dto: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.deleteAccountService.execute(user, dto);
    clearSessionCookie(res);
  }
}
