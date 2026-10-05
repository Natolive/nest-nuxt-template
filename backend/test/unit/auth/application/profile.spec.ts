import { WrongPasswordError } from '@src/auth/domain/errors/wrong-password.error.js';
import { UserNotFoundError } from '@src/users/domain/errors/user-not-found.error.js';
import { LastSuperAdminError } from '@src/auth/domain/errors/last-super-admin.error.js';
import { credentials, dto, opened, setupAuth } from './setup.js';

describe('UpdateProfileService', () => {
  it('renames me', async () => {
    const auth = await setupAuth();
    const { user } = await auth.loggedIn();
    expect(await auth.updateProfile.execute(user, { firstName: 'Léna', lastName: 'Martin' })).toEqual({ ...user, firstName: 'Léna', lastName: 'Martin' });
    await expect(auth.updateProfile.execute({ ...user, id: 'gone' }, { firstName: 'X', lastName: 'Y' })).rejects.toBeInstanceOf(UserNotFoundError);
  });
});

describe('ChangePasswordService', () => {
  it('changes my password and signs out my other devices only', async () => {
    const auth = await setupAuth();
    const here = await auth.loggedIn();
    const elsewhere = opened(await auth.login.execute(credentials));
    await auth.changePassword.execute(here.user, here.token, { currentPassword: credentials.password, password: 'new-password' });
    await expect(auth.authenticate.execute(elsewhere.token)).rejects.toThrow();
    expect(await auth.authenticate.execute(here.token)).toMatchObject({ email: credentials.email });
    expect(opened(await auth.login.execute({ ...credentials, password: 'new-password' })).user.email).toBe(credentials.email);
  });

  it('needs the current password', async () => {
    const auth = await setupAuth();
    const { user, token } = await auth.loggedIn();
    await expect(auth.changePassword.execute(user, token, { currentPassword: 'wrong', password: 'new-password' })).rejects.toBeInstanceOf(WrongPasswordError);
    await expect(auth.changePassword.execute({ ...user, id: 'gone' }, token, { currentPassword: 'x', password: 'new-password' })).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('signs out every device when called without a session', async () => {
    const auth = await setupAuth();
    const { user, token } = await auth.loggedIn();
    await auth.changePassword.execute(user, undefined, { currentPassword: credentials.password, password: 'new-password' });
    await expect(auth.authenticate.execute(token)).rejects.toThrow();
  });
});

describe('DeleteAccountService', () => {
  it('needs my password, then deletes my account and its sessions', async () => {
    const auth = await setupAuth();
    const { user, token } = await auth.loggedIn();
    await expect(auth.deleteAccount.execute(user, { password: 'wrong' })).rejects.toBeInstanceOf(WrongPasswordError);
    await auth.deleteAccount.execute(user, { password: credentials.password });
    expect(auth.users.rows).toEqual([]);
    // Sessions supprimées en cascade par la base (vérifié en e2e) : ici, le compte manque.
    await expect(auth.authenticate.execute(token)).rejects.toBeInstanceOf(UserNotFoundError);
    await expect(auth.deleteAccount.execute(user, { password: credentials.password })).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('keeps the last super admin, not the others', async () => {
    const auth = await setupAuth();
    const { user } = await auth.loggedIn();
    auth.users.rows[0].role = 'super_admin';
    await expect(auth.deleteAccount.execute(user, { password: credentials.password })).rejects.toBeInstanceOf(LastSuperAdminError);
    await auth.users.create({ ...dto, email: 'max@exemple.fr', passwordHash: 'x', role: 'super_admin' });
    await auth.deleteAccount.execute(user, { password: credentials.password });
    expect(auth.users.rows.map((u) => u.email)).toEqual(['max@exemple.fr']);
  });
});
