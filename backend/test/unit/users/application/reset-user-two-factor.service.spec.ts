import { ResetUserTwoFactorService } from '@src/users/application/reset-user-two-factor.service.js';
import { OwnAccessLockedError } from '@src/users/domain/errors/own-access-locked.error.js';
import { SuperAdminOnlyError } from '@src/users/domain/errors/super-admin-only.error.js';
import { setupUsers } from './setup.js';

describe('ResetUserTwoFactorService', () => {
  it('turns off the 2FA of someone else, key and recovery codes included', async () => {
    const { users, manager, lea } = await setupUsers();
    await users.update(lea.id, { totpSecret: 'ABC', twoFactorEnabledAt: new Date(), recoveryCodeHashes: ['x'] });
    expect(await new ResetUserTwoFactorService(users).execute(manager, lea.id)).toMatchObject({ twoFactorEnabled: false });
    expect(users.rows[2]).toMatchObject({ totpSecret: null, twoFactorEnabledAt: null, recoveryCodeHashes: [] });
  });

  it('never on its own account, nor on a super admin without being one', async () => {
    const { users, admin, manager } = await setupUsers();
    const reset = new ResetUserTwoFactorService(users);
    await expect(reset.execute(manager, manager.id)).rejects.toBeInstanceOf(OwnAccessLockedError);
    await expect(reset.execute(manager, admin.id)).rejects.toBeInstanceOf(SuperAdminOnlyError);
  });
});
