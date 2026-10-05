import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@src/app.module.js';
import { ScryptPasswordHasher } from '@src/auth/infrastructure/scrypt-password-hasher.js';
import { DB, type Database } from '@src/common/infrastructure/database/database.module.js';
import { DrizzleRolePermissionRepository } from '@src/roles/infrastructure/drizzle-role-permission.repository.js';
import { users } from '@src/users/infrastructure/user.table.js';
import { eq, like } from 'drizzle-orm';
import request from 'supertest';

// Administration sur la vraie base : comptes créés confirmés (comme par `npm run user:create`), supprimés à la fin.
describe('Users and roles (e2e)', () => {
  const stamp = Date.now();
  const emailOf = (name: string) => `e2e-users-${name}-${stamp}@exemple.fr`;
  const password = '12345678';
  let app: INestApplication;
  let db: Database;
  let savedAdminRole: Awaited<ReturnType<DrizzleRolePermissionRepository['findByRole']>>;

  const createUser = async (name: string, role: 'user' | 'admin' | 'super_admin') => {
    const [row] = await db
      .insert(users)
      .values({ email: emailOf(name), firstName: name, lastName: `E2e${stamp}`, role, emailVerifiedAt: new Date(), passwordHash: await new ScryptPasswordHasher().hash(password) })
      .returning();
    return row;
  };
  const agent = async (name: string) => {
    const http = request.agent(app.getHttpServer());
    await http.post('/auth/login').send({ email: emailOf(name), password }).expect(200);
    return http;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    db = app.get(DB);
    // Droits du rôle admin partagés avec le dev : remis tels quels à la fin.
    savedAdminRole = await new DrizzleRolePermissionRepository(db).findByRole('admin');
  });

  afterAll(async () => {
    await new DrizzleRolePermissionRepository(db).replaceForRole('admin', savedAdminRole.map(({ role, permission, granted }) => ({ role, permission, granted })));
    await db.delete(users).where(like(users.email, `e2e-users-%-${stamp}@exemple.fr`));
    await app.close();
  });

  it('lets an admin manage accounts within the rules, and a super admin manage roles', async () => {
    const boss = await createUser('boss', 'super_admin');
    const admin = await createUser('admin', 'admin');
    const lea = await createUser('lea', 'user');
    await db.update(users).set({ totpSecret: 'ABC', twoFactorEnabledAt: new Date() }).where(eq(users.id, lea.id));
    const asAdmin = await agent('admin');

    // Liste : recherche, filtres, tri, pagination.
    await asAdmin.get('/users?pageSize=7').expect(400);
    const list = await asAdmin.get('/users').query({ q: `e2e${stamp}`, sort: 'role', desc: 'true' }).expect(200);
    expect(list.body).toMatchObject({ total: 3, page: 1 });
    expect(list.body.items.map((u: { email: string }) => u.email)).toEqual([emailOf('boss'), emailOf('admin'), emailOf('lea')]);
    expect(list.body.items[2]).toMatchObject({ role: 'user', extraPermissions: [], emailVerified: true, twoFactorEnabled: true });
    expect(list.body.items[2]).not.toHaveProperty('passwordHash');

    // Droits par défaut d'un admin : modifier et couper la 2FA, pas le rôle, les droits ni la suppression.
    await asAdmin.patch(`/users/${lea.id}`).send({ firstName: 'Léa', lastName: 'Durand', email: emailOf('lea') }).expect(200);
    await asAdmin.patch(`/users/${lea.id}`).send({ firstName: 'Léa', lastName: 'Durand', email: emailOf('admin') }).expect(409);
    await asAdmin.patch(`/users/${boss.id}`).send({ firstName: 'Boss', lastName: 'X', email: emailOf('boss') }).expect(403);
    await asAdmin.patch('/users/not-a-uuid').send({}).expect(400);
    expect((await asAdmin.post(`/users/${lea.id}/2fa/reset`).expect(200)).body.twoFactorEnabled).toBe(false);
    await asAdmin.put(`/users/${lea.id}/role`).send({ role: 'admin' }).expect(403);
    await asAdmin.put(`/users/${lea.id}/permissions`).send({ extraPermissions: [] }).expect(403);
    await asAdmin.delete(`/users/${lea.id}`).expect(403);
    await asAdmin.get('/roles').expect(403);

    // Le super admin donne plus de droits au rôle admin : effet immédiat.
    const asBoss = await agent('boss');
    const roles = await asBoss.get('/roles').expect(200);
    expect(roles.body).toContainEqual({ role: 'super_admin', permissions: expect.arrayContaining(['roles.update']), editable: false });
    await asBoss.put('/roles/super_admin').send({ permissions: [] }).expect(403);
    await asBoss.put('/roles/admin').send({ permissions: ['nope'] }).expect(400);
    await asBoss.put('/roles/admin').send({ permissions: ['users.read', 'users.update_role', 'users.delete'] }).expect(200);
    expect((await asAdmin.get('/auth/me').expect(200)).body.permissions).toEqual(['users.read', 'users.update_role', 'users.delete']);

    await asAdmin.put(`/users/${lea.id}/role`).send({ role: 'super_admin' }).expect(403);
    expect((await asAdmin.put(`/users/${lea.id}/role`).send({ role: 'admin' }).expect(200)).body.role).toBe('admin');
    await asAdmin.put(`/users/${admin.id}/role`).send({ role: 'user' }).expect(403);
    expect((await asBoss.put(`/users/${lea.id}/permissions`).send({ extraPermissions: ['roles.read'] }).expect(200)).body.extraPermissions).toEqual(['roles.read']);
    await asAdmin.delete(`/users/${boss.id}`).expect(403);
    await asAdmin.delete(`/users/${admin.id}`).expect(403);
    await asAdmin.delete(`/users/${lea.id}`).expect(204);
    await asAdmin.delete(`/users/${lea.id}`).expect(404);
  });
});
