import { BadRequestException } from '@nestjs/common';
import { accountSchema } from '@socle/shared';
import { ZodValidationPipe } from '@src/common/infrastructure/http/pipes/zod-validation.pipe.js';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(accountSchema);

  it('returns the parsed body', () => {
    const body = { lastName: ' Dupont ', firstName: 'Léa', email: 'Lea@Example.com', password: '12345678' };
    expect(pipe.transform(body)).toEqual({ ...body, lastName: 'Dupont', email: 'lea@example.com' });
  });

  it('rejects an invalid body with field errors', () => {
    try {
      pipe.transform({ lastName: '', email: 'nope', password: '123' });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      const { errors } = (e as BadRequestException).getResponse() as { errors: Record<string, string[]> };
      expect(Object.keys(errors).sort()).toEqual(['email', 'firstName', 'lastName', 'password']);
    }
  });
});
