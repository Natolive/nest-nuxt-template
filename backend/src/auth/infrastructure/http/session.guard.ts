import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission } from '@socle/shared';
import { AuthenticateService } from '../../application/authenticate.service.js';
import { MissingPermissionError } from '../../domain/errors/missing-permission.error.js';
import type { AuthenticatedRequest } from './authenticated-request.js';
import { readSessionCookie } from './session-cookie.js';

export const AUTHORIZE = 'authorize';

// Guard global (APP_GUARD) : n'agit que sur les routes marquées `@Authorize(...)`, les autres restent publiques.
// 401 sans session valable, 403 sans le droit demandé.
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly authenticate: AuthenticateService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rule = this.reflector.get<{ permission?: Permission } | undefined>(AUTHORIZE, context.getHandler());
    if (!rule) return true;
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    req.user = await this.authenticate.execute(readSessionCookie(req));
    if (rule.permission && !req.user.permissions.includes(rule.permission)) throw new MissingPermissionError();
    return true;
  }
}
