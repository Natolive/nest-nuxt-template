import { Injectable } from '@nestjs/common';
import type { UpdateProfileDto, UserDto } from '@socle/shared';
import { orThrow } from '../../common/application/or-throw.js';
import { UserNotFoundError } from '../../users/domain/errors/user-not-found.error.js';
import { UserRepository } from '../../users/domain/user.repository.js';
import { BuildAuthenticatedUserService } from './build-authenticated-user.service.js';

@Injectable()
export class UpdateProfileService {
  constructor(
    private readonly users: UserRepository,
    private readonly buildAuthenticatedUser: BuildAuthenticatedUserService,
  ) {}

  async execute(user: UserDto, dto: UpdateProfileDto): Promise<UserDto> {
    return this.buildAuthenticatedUser.execute(orThrow(await this.users.update(user.id, dto), UserNotFoundError));
  }
}
