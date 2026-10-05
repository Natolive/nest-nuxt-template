import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './common/infrastructure/database/database.module.js';
import { DomainErrorFilter } from './common/infrastructure/http/domain-error.filter.js';
import { RolesModule } from './roles/roles.module.js';
import { UsersModule } from './users/users.module.js';

// Nouveau domaine = son module ici.
@Module({
  imports: [DatabaseModule, AuthModule, UsersModule, RolesModule],
  controllers: [AppController],
  providers: [{ provide: APP_FILTER, useClass: DomainErrorFilter }],
})
export class AppModule {}
