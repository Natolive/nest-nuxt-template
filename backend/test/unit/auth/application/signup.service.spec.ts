import { InvalidVerificationLinkError } from '@src/auth/domain/errors/invalid-verification-link.error.js';
import { EmailAlreadyUsedError } from '@src/users/domain/errors/email-already-used.error.js';
import { dto, setupAuth } from './setup.js';

describe('SignupService', () => {
  let auth: Awaited<ReturnType<typeof setupAuth>>;

  beforeEach(async () => {
    auth = await setupAuth();
  });

  it('stores the hashed password, with an unconfirmed email', async () => {
    await auth.signup.execute(dto);
    expect(auth.users.rows[0]).toMatchObject({ email: dto.email, passwordHash: 'hashed:12345678', role: 'user', emailVerifiedAt: null });
  });

  it('rejects an email already confirmed', async () => {
    await auth.signup.execute(dto);
    await auth.confirm();
    await expect(auth.signup.execute(dto)).rejects.toBeInstanceOf(EmailAlreadyUsedError);
  });

  it('replaces an unconfirmed account and sends a new link that alone is valid', async () => {
    await auth.signup.execute(dto);
    const oldToken = auth.mailer.lastToken();
    await auth.signup.execute({ ...dto, password: 'new-password' });
    expect(auth.users.rows).toHaveLength(1);
    expect(auth.users.rows[0].passwordHash).toBe('hashed:new-password');
    await expect(auth.confirm('new-password', oldToken)).rejects.toBeInstanceOf(InvalidVerificationLinkError);
    await auth.confirm('new-password');
    expect(auth.users.rows[0].emailVerifiedAt).toBeInstanceOf(Date);
  });

});
