import { totp } from '@src/auth/application/totp.js';
import { InvalidTwoFactorCodeError } from '@src/auth/domain/errors/invalid-two-factor-code.error.js';
import { TwoFactorAlreadyEnabledError } from '@src/auth/domain/errors/two-factor-already-enabled.error.js';
import { TwoFactorChallengeExpiredError } from '@src/auth/domain/errors/two-factor-challenge-expired.error.js';
import { TwoFactorNotEnabledError } from '@src/auth/domain/errors/two-factor-not-enabled.error.js';
import { TwoFactorNotSetUpError } from '@src/auth/domain/errors/two-factor-not-set-up.error.js';
import { WrongPasswordError } from '@src/auth/domain/errors/wrong-password.error.js';
import { UserNotFoundError } from '@src/users/domain/errors/user-not-found.error.js';
import { credentials, setupAuth } from './setup.js';

// Code à 6 chiffres qui n'est pas celui du moment (ni des périodes voisines).
const wrong = (code: string) => String((Number(code) + 500_000) % 1_000_000).padStart(6, '0');

describe('2FA setup', () => {
  it('gives a key to scan, then enables 2FA with a first good code and 8 one-time recovery codes', async () => {
    const auth = await setupAuth();
    const { user } = await auth.loggedIn();
    const setup = await auth.setupTwoFactor.execute(user);
    expect(setup.otpauthUrl).toContain(`secret=${setup.secret}`);
    await expect(auth.enableTwoFactor.execute(user, { code: wrong(totp(setup.secret)) })).rejects.toBeInstanceOf(InvalidTwoFactorCodeError);
    const { recoveryCodes } = await auth.enableTwoFactor.execute(user, { code: totp(setup.secret) });
    expect(recoveryCodes).toHaveLength(8);
    expect(recoveryCodes[0]).toMatch(/^[A-Z2-7]{4}-[A-Z2-7]{4}$/);
    // Stockés hachés, jamais en clair.
    expect(auth.users.rows[0].recoveryCodeHashes).not.toContain(recoveryCodes[0].replace('-', ''));
    expect(auth.users.rows[0].twoFactorEnabledAt).toBeInstanceOf(Date);
  });

  it('refuses to set up or enable twice, or to enable without setting up', async () => {
    const auth = await setupAuth();
    const { user, secret } = await auth.withTwoFactor();
    const enabled = { ...user, twoFactorEnabled: true };
    await expect(auth.setupTwoFactor.execute(enabled)).rejects.toBeInstanceOf(TwoFactorAlreadyEnabledError);
    await expect(auth.enableTwoFactor.execute(enabled, { code: totp(secret) })).rejects.toBeInstanceOf(TwoFactorAlreadyEnabledError);

    const other = await setupAuth();
    const { user: fresh } = await other.loggedIn();
    await expect(other.enableTwoFactor.execute(fresh, { code: '123456' })).rejects.toBeInstanceOf(TwoFactorNotSetUpError);
    await expect(other.enableTwoFactor.execute({ ...fresh, id: 'gone' }, { code: '123456' })).rejects.toBeInstanceOf(UserNotFoundError);
  });
});

describe('Login with 2FA', () => {
  it('asks for a code after the password, then opens the session with the app code', async () => {
    const auth = await setupAuth();
    const { secret } = await auth.withTwoFactor();
    const result = await auth.login.execute({ ...credentials, remember: true });
    expect(result).toEqual({ challenge: expect.any(String) });
    const { challenge } = result as { challenge: string };
    await expect(auth.loginTwoFactor.execute({ challenge, code: wrong(totp(secret)) })).rejects.toBeInstanceOf(InvalidTwoFactorCodeError);
    const session = await auth.loginTwoFactor.execute({ challenge, code: totp(secret) });
    expect(session).toMatchObject({ remember: true, user: { email: credentials.email, twoFactorEnabled: true } });
    // Jeton utilisé : il ne sert plus.
    await expect(auth.loginTwoFactor.execute({ challenge, code: totp(secret) })).rejects.toBeInstanceOf(TwoFactorChallengeExpiredError);
  });

  it('accepts a recovery code once, with or without its dash', async () => {
    const auth = await setupAuth();
    const { recoveryCodes } = await auth.withTwoFactor();
    const login = async () => ((await auth.login.execute(credentials)) as { challenge: string }).challenge;
    await auth.loginTwoFactor.execute({ challenge: await login(), code: recoveryCodes[0] });
    expect(auth.users.rows[0].recoveryCodeHashes).toHaveLength(7);
    await expect(auth.loginTwoFactor.execute({ challenge: await login(), code: recoveryCodes[0] })).rejects.toBeInstanceOf(InvalidTwoFactorCodeError);
    await auth.loginTwoFactor.execute({ challenge: await login(), code: recoveryCodes[1].replace('-', '') });
    expect(auth.users.rows[0].recoveryCodeHashes).toHaveLength(6);
  });

  it('starts over if 2FA was turned off meanwhile', async () => {
    const auth = await setupAuth();
    const { secret } = await auth.withTwoFactor();
    const { challenge } = (await auth.login.execute(credentials)) as { challenge: string };
    await auth.users.update(auth.users.rows[0].id, { twoFactorEnabledAt: null });
    await expect(auth.loginTwoFactor.execute({ challenge, code: totp(secret) })).rejects.toBeInstanceOf(TwoFactorChallengeExpiredError);
  });
});

describe('2FA disable', () => {
  it('needs my password and a code, then logs in without code again', async () => {
    const auth = await setupAuth();
    const { user, secret, recoveryCodes } = await auth.withTwoFactor();
    await expect(auth.disableTwoFactor.execute(user, { password: 'wrong', code: totp(secret) })).rejects.toBeInstanceOf(WrongPasswordError);
    await expect(auth.disableTwoFactor.execute(user, { password: credentials.password, code: wrong(totp(secret)) })).rejects.toBeInstanceOf(InvalidTwoFactorCodeError);
    await auth.disableTwoFactor.execute(user, { password: credentials.password, code: recoveryCodes[0] });
    expect(auth.users.rows[0]).toMatchObject({ totpSecret: null, twoFactorEnabledAt: null, recoveryCodeHashes: [] });
    expect(await auth.login.execute(credentials)).toHaveProperty('token');
    await expect(auth.disableTwoFactor.execute(user, { password: credentials.password, code: '123456' })).rejects.toBeInstanceOf(TwoFactorNotEnabledError);
    await expect(auth.disableTwoFactor.execute({ ...user, id: 'gone' }, { password: 'x', code: '123456' })).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
