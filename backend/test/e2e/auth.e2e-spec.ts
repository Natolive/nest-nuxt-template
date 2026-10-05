import type { INestApplication } from '@nestjs/common';
import { APP_NAME } from '@socle/shared';
import { Test } from '@nestjs/testing';
import { totp } from '@src/auth/application/totp.js';
import { AppModule } from '@src/app.module.js';
import { DB, type Database } from '@src/common/infrastructure/database/database.module.js';
import { Mailer } from '@src/mail/domain/mailer.js';
import { users } from '@src/users/infrastructure/user.table.js';
import { FakeMailer } from '@test/fakes/fake-mailer.js';
import { like } from 'drizzle-orm';
import request from 'supertest';

// Parcours complet sur la vraie base (DATABASE_URL du conteneur back) ; emails gardés par FakeMailer.
describe('Auth (e2e)', () => {
  const stamp = Date.now();
  const email = `e2e-auth-${stamp}@exemple.fr`;
  const account = { firstName: 'Léa', lastName: 'Dupont', email, password: '12345678' };
  let app: INestApplication;
  let db: Database;
  const mailer = new FakeMailer();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(Mailer).useValue(mailer).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    db = app.get(DB);
  });

  afterAll(async () => {
    await db.delete(users).where(like(users.email, `e2e-auth-%${stamp}@exemple.fr`));
    await app.close();
  });

  it('signs up, confirms the email, logs in, edits the profile, then logs out', async () => {
    const http = request.agent(app.getHttpServer());

    await http.get('/auth/me').expect(401);
    await http.post('/auth/signup').send({ ...account, password: 'court' }).expect(400);
    await http.post('/auth/signup').send(account).expect(204);
    await http.post('/auth/login').send({ email, password: account.password }).expect(403);
    await http.post('/auth/verify-email').send({ token: 'nope', password: account.password }).expect(404);
    await http.post('/auth/verify-email').send({ token: mailer.lastToken(), password: 'wrong-password' }).expect(401);
    const verified = await http.post('/auth/verify-email').send({ token: mailer.lastToken(), password: account.password }).expect(200);
    expect(verified.headers['set-cookie']?.[0]).toMatch(/socle_session=.+HttpOnly/);
    await http.post('/auth/signup').send(account).expect(409);

    const me = await http.get('/auth/me').expect(200);
    expect(me.body).toEqual({ id: expect.any(String), email, firstName: 'Léa', lastName: 'Dupont', role: 'user', twoFactorEnabled: false, permissions: [] });
    await http.get('/users').expect(403);
    await http.get('/roles').expect(403);

    expect((await http.patch('/auth/me').send({ firstName: ' Léna ', lastName: 'Martin', email: 'autre@exemple.fr' }).expect(200)).body).toMatchObject({ firstName: 'Léna', lastName: 'Martin', email });
    await http.patch('/auth/me').send({ firstName: '', lastName: 'Martin' }).expect(400);

    await http.post('/auth/logout').expect(204);
    await http.get('/auth/me').expect(401);
    await http.post('/auth/login').send({ email, password: 'wrong-password' }).expect(401);

    // Sans « Rester connecté » : cookie de session, effacé à la fermeture du navigateur ; avec, il a une date d'expiration.
    const remembered = await http.post('/auth/login').send({ email, password: account.password, remember: true }).expect(200);
    expect(remembered.headers['set-cookie']?.[0]).toMatch(/Expires=/);
    const login = await http.post('/auth/login').send({ email, password: account.password }).expect(200);
    expect(login.headers['set-cookie']?.[0]).not.toMatch(/Expires=/);
    expect(login.body.user).toMatchObject({ email });
  });

  it('changes the password, turns 2FA on and off, resets a forgotten password, then deletes the account', async () => {
    const http = request.agent(app.getHttpServer());
    await http.post('/auth/login').send({ email, password: account.password }).expect(200, /"user"/);

    await http.post('/auth/me/password').send({ currentPassword: 'wrong', password: 'new-password' }).expect(400);
    await http.post('/auth/me/password').send({ currentPassword: account.password, password: 'court' }).expect(400);
    await http.post('/auth/me/password').send({ currentPassword: account.password, password: 'new-password' }).expect(204);
    await http.get('/auth/me').expect(200);

    // 2FA : clé, premier code, codes de secours.
    await http.post('/auth/me/2fa/enable').send({ code: '123456' }).expect(400);
    const { body: setup } = await http.post('/auth/me/2fa/setup').expect(200);
    expect(setup.otpauthUrl.startsWith(`otpauth://totp/${encodeURIComponent(APP_NAME)}%3A`)).toBe(true);
    await http.post('/auth/me/2fa/enable').send({ code: 'abc' }).expect(400);
    const { body: codes } = await http.post('/auth/me/2fa/enable').send({ code: totp(setup.secret) }).expect(200);
    expect(codes.recoveryCodes).toHaveLength(8);
    await http.post('/auth/me/2fa/setup').expect(409);
    expect((await http.get('/auth/me').expect(200)).body.twoFactorEnabled).toBe(true);

    // Connexion : mot de passe, puis code.
    const fresh = request.agent(app.getHttpServer());
    const { body: step } = await fresh.post('/auth/login').send({ email, password: 'new-password', remember: true }).expect(200);
    expect(step).toEqual({ challenge: expect.any(String) });
    await fresh.get('/auth/me').expect(401);
    await fresh.post('/auth/login/2fa').send({ challenge: step.challenge, code: '12' }).expect(400);
    const done = await fresh.post('/auth/login/2fa').send({ challenge: step.challenge, code: codes.recoveryCodes[0] }).expect(200);
    expect(done.headers['set-cookie']?.[0]).toMatch(/socle_session=.+Expires=/);
    await fresh.get('/auth/me').expect(200);
    await fresh.post('/auth/login/2fa').send({ challenge: step.challenge, code: totp(setup.secret) }).expect(401);

    // Mot de passe oublié : le lien change le mot de passe et déconnecte partout, sans contourner la 2FA.
    await http.post('/auth/forgot-password').send({ email: `e2e-auth-nobody-${stamp}@exemple.fr` }).expect(204);
    expect(mailer.sent.at(-1)!.to.email).not.toMatch(/nobody/);
    await http.post('/auth/forgot-password').send({ email }).expect(204);
    await http.post('/auth/reset-password').send({ token: mailer.lastToken(), password: 'court' }).expect(400);
    await http.post('/auth/reset-password').send({ token: mailer.lastToken(), password: 'reset-password' }).expect(204);
    await http.post('/auth/reset-password').send({ token: mailer.lastToken(), password: 'other-password' }).expect(404);
    await http.get('/auth/me').expect(401);
    expect((await http.post('/auth/login').send({ email, password: 'reset-password' }).expect(200)).body).toHaveProperty('challenge');

    // Retour avec un code, puis 2FA coupée et compte supprimé.
    const back = request.agent(app.getHttpServer());
    const { body: again } = await back.post('/auth/login').send({ email, password: 'reset-password' }).expect(200);
    await back.post('/auth/login/2fa').send({ challenge: again.challenge, code: totp(setup.secret) }).expect(200);
    await back.post('/auth/me/2fa/disable').send({ password: 'wrong', code: totp(setup.secret) }).expect(400);
    await back.post('/auth/me/2fa/disable').send({ password: 'reset-password', code: totp(setup.secret) }).expect(204);
    expect((await back.post('/auth/login').send({ email, password: 'reset-password' }).expect(200)).body).toHaveProperty('user');

    await back.delete('/auth/me').send({ password: 'wrong' }).expect(400);
    const deleted = await back.delete('/auth/me').send({ password: 'reset-password' }).expect(204);
    expect(deleted.headers['set-cookie']?.[0]).toMatch(/socle_session=;/);
    await back.get('/auth/me').expect(401);
    await back.post('/auth/login').send({ email, password: 'reset-password' }).expect(401);
  });

  it('limits login attempts per email', async () => {
    const http = request(app.getHttpServer());
    const other = { email: `e2e-auth-limit-${stamp}@exemple.fr`, password: 'wrong-password' };
    for (let i = 0; i < 10; i++) await http.post('/auth/login').send(other).expect(401);
    await http.post('/auth/login').send(other).expect(429);
  });
});
