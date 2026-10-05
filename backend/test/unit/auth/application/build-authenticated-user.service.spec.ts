import { setupAuth } from './setup.js';

describe('BuildAuthenticatedUserService', () => {
  it('gives the effective permissions of the role, never the password hash', async () => {
    const auth = await setupAuth();
    const { user, token } = await auth.loggedIn();
    expect(user).toEqual({ id: '1', email: 'lea@exemple.fr', firstName: 'Léa', lastName: 'Dupont', role: 'user', twoFactorEnabled: false, permissions: [] });
    auth.users.rows[0].role = 'admin';
    expect((await auth.authenticate.execute(token)).permissions).toEqual(['users.read', 'users.update', 'users.reset_two_factor']);
  });

  it('adds the extra permissions of the person to those of the role', async () => {
    const auth = await setupAuth();
    const { token } = await auth.loggedIn();
    auth.users.rows[0].extraPermissions = ['users.read'];
    expect((await auth.authenticate.execute(token)).permissions).toEqual(['users.read']);
  });
});
