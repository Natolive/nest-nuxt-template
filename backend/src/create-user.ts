import { accountSchema, ROLES } from '@socle/shared';
import { drizzle } from 'drizzle-orm/node-postgres';
import { z } from 'zod';
import { ScryptPasswordHasher } from './auth/infrastructure/scrypt-password-hasher.js';
import * as schema from './common/infrastructure/database/schema.js';
import { DrizzleUserRepository } from './users/infrastructure/drizzle-user.repository.js';

// Compte créé déjà confirmé, sans passer par l'inscription : sert surtout au premier super admin.
// `docker compose exec backend npm run user:create -- <email> <mot de passe> <prénom> <nom> [user|admin|super_admin]`
const [email, password, firstName, lastName, role = 'user'] = process.argv.slice(2);
const parsed = accountSchema.extend({ role: z.enum(ROLES, `Choisis un rôle parmi ${ROLES.join(', ')}.`) }).safeParse({ email, password, firstName, lastName, role });
if (!parsed.success) {
  console.error(z.prettifyError(parsed.error));
  process.exit(1);
}

const { password: plain, ...dto } = parsed.data;
const db = drizzle(process.env.DATABASE_URL!, { schema });
try {
  const user = await new DrizzleUserRepository(db).create({ ...dto, passwordHash: await new ScryptPasswordHasher().hash(plain), emailVerifiedAt: new Date() });
  console.log(`Compte créé : ${user.email} (${user.role})`);
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await db.$client.end();
}
