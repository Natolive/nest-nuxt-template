import { ROLES, type Permission } from '@socle/shared';
import { sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Valeurs dans l'ordre de ROLES : trier sur la colonne trie du moins au plus de pouvoir.
export const role = pgEnum('role', ROLES);

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: role().notNull().default('user'),
  // Droits accordés en plus de ceux du rôle ; texte et non enum : ajouter un droit dans le code ne demande pas de migration.
  extraPermissions: text('extra_permissions').array().$type<Permission[]>().notNull().default(sql`'{}'`),
  // Email confirmé par le lien reçu à l'inscription ; null tant que ce n'est pas fait (connexion refusée).
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  // Hash du jeton du lien de confirmation ; null une fois l'email confirmé.
  emailVerificationTokenHash: text('email_verification_token_hash').unique(),
  emailVerificationExpiresAt: timestamp('email_verification_expires_at', { withTimezone: true }),
  // Lien « mot de passe oublié » en cours ; null sinon.
  passwordResetTokenHash: text('password_reset_token_hash').unique(),
  passwordResetExpiresAt: timestamp('password_reset_expires_at', { withTimezone: true }),
  // Clé de l'application d'authentification (base32) ; posée dès la mise en place, active une fois `twoFactorEnabledAt` rempli.
  // ponytail: clé en clair en base (comme la plupart des applis) ; la chiffrer avec une clé serveur si la base doit être partagée.
  totpSecret: text('totp_secret'),
  twoFactorEnabledAt: timestamp('two_factor_enabled_at', { withTimezone: true }),
  // Codes de secours restants, hachés ; chacun ne sert qu'une fois.
  recoveryCodeHashes: text('recovery_code_hashes').array().notNull().default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
