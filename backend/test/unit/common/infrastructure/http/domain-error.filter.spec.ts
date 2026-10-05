import type { ArgumentsHost } from '@nestjs/common';
import { ConflictError } from '@src/common/domain/errors/conflict.error.js';
import { DomainError } from '@src/common/domain/errors/domain.error.js';
import { ForbiddenError } from '@src/common/domain/errors/forbidden.error.js';
import { NotFoundError } from '@src/common/domain/errors/not-found.error.js';
import { TooManyRequestsError } from '@src/common/domain/errors/too-many-requests.error.js';
import { UnauthorizedError } from '@src/common/domain/errors/unauthorized.error.js';
import { DomainErrorFilter } from '@src/common/infrastructure/http/domain-error.filter.js';

class InvalidError extends DomainError {}

const statusOf = (error: DomainError) => {
  let sent: { status?: number; body?: unknown } = {};
  const res = { status: (status: number) => ({ json: (body: unknown) => (sent = { status, body }) }) };
  new DomainErrorFilter().catch(error, { switchToHttp: () => ({ getResponse: () => res }) } as unknown as ArgumentsHost);
  return sent;
};

describe('DomainErrorFilter', () => {
  it.each([
    [new NotFoundError('x'), 404],
    [new ConflictError('x'), 409],
    [new UnauthorizedError('x'), 401],
    [new ForbiddenError('x'), 403],
    [new TooManyRequestsError('x'), 429],
    [new InvalidError('x'), 400],
  ])('maps %o to %i', (error, status) => {
    expect(statusOf(error)).toEqual({ status, body: { statusCode: status, message: 'x' } });
  });
});
