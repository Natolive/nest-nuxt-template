import { PERMISSIONS } from '@socle/shared';
import { RolePermissionsService } from '@src/roles/application/role-permissions.service.js';
import { InMemoryRolePermissionRepository } from '@test/fakes/in-memory-role-permission.repository.js';

describe('RolePermissionsService', () => {
  it('gives user nothing to administer, admin the accounts, super_admin everything', async () => {
    const rolePermissions = new RolePermissionsService(new InMemoryRolePermissionRepository());
    expect(await rolePermissions.execute('user')).toEqual([]);
    expect(await rolePermissions.execute('admin')).toEqual(['users.read', 'users.update', 'users.reset_two_factor']);
    expect(await rolePermissions.execute('super_admin')).toEqual([...PERMISSIONS]);
  });

  it('applies what an admin saved, the code default otherwise', async () => {
    const repository = new InMemoryRolePermissionRepository();
    await repository.create({ role: 'admin', permission: 'users.update', granted: false });
    await repository.create({ role: 'admin', permission: 'users.delete', granted: true });
    expect(await new RolePermissionsService(repository).execute('admin')).toEqual(['users.read', 'users.reset_two_factor', 'users.delete']);
  });
});
