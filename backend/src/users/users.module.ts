import { Module } from '@nestjs/common';
import { DeleteUserService } from './application/delete-user.service.js';
import { FindUsersService } from './application/find-users.service.js';
import { ResetUserTwoFactorService } from './application/reset-user-two-factor.service.js';
import { UpdateUserPermissionsService } from './application/update-user-permissions.service.js';
import { UpdateUserRoleService } from './application/update-user-role.service.js';
import { UpdateUserService } from './application/update-user.service.js';
import { UserRepository } from './domain/user.repository.js';
import { DrizzleUserRepository } from './infrastructure/drizzle-user.repository.js';
import { UsersController } from './infrastructure/http/users.controller.js';

// Administration des comptes ; routes protégées par le guard global d'AuthModule.
@Module({
  controllers: [UsersController],
  providers: [
    DeleteUserService,
    FindUsersService,
    ResetUserTwoFactorService,
    UpdateUserPermissionsService,
    UpdateUserRoleService,
    UpdateUserService,
    { provide: UserRepository, useClass: DrizzleUserRepository },
  ],
  // Le compte connecté (inscription, profil, mot de passe, 2FA) se gère dans AuthModule.
  exports: [UserRepository],
})
export class UsersModule {}
