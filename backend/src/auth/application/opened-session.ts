import type { UserDto } from '@socle/shared';

export interface OpenedSession {
  token: string;
  expiresAt: Date;
  remember: boolean;
  user: UserDto;
}
