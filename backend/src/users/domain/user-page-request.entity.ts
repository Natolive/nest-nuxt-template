import type { UserSort } from '@socle/shared';

export interface UserPageRequest {
  sort: UserSort;
  desc: boolean;
  offset: number;
  limit: number;
}
