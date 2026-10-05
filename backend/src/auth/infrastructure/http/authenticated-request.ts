import type { Request } from 'express';
import type { UserDto } from '@socle/shared';

// Requête passée par SessionGuard : la personne connectée y est attachée.
export type AuthenticatedRequest = Request & { user: UserDto };
