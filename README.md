# Socle

[![CI](https://github.com/Natolive/nest-nuxt-template/actions/workflows/ci.yml/badge.svg)](https://github.com/Natolive/nest-nuxt-template/actions/workflows/ci.yml)

**Le point de départ de mes applications web.** Socle est une application vide de métier mais complète côté comptes : on s'inscrit, on confirme son email, on se connecte (avec double authentification si on veut), on gère son profil, et les administrateurs gèrent les utilisateurs et leurs droits. Un nouveau projet part d'ici et n'a plus qu'à ajouter ce qui lui est propre.

Stack : Nest + Drizzle + Postgres pour l'API, Nuxt + Nuxt UI pour l'interface, schémas Zod partagés entre les deux, tout dans Docker, tests à 100 % de couverture, CI et déploiement GitHub Actions.

---

## Ce que fait l'application

### 1. Créer un compte — page « Créer un compte »

Prénom, nom, email et mot de passe (8 caractères minimum). Un email arrive avec un lien **valable 48 heures** : l'ouvrir et ressaisir son mot de passe active le compte et connecte. Tant que l'email n'est pas confirmé, la connexion est refusée.

- Rien reçu, ou faute de frappe dans le mot de passe ? Recommencer l'inscription avec le même email : le nouveau lien remplace l'ancien.
- Un email déjà confirmé ne peut pas servir à une deuxième inscription.

### 2. Se connecter — page « Connexion »

Email et mot de passe, avec « Rester connecté » (30 jours ; sinon la session dure 12 heures au plus et s'arrête à la fermeture du navigateur).

- **Double authentification active** : une étape « Vérification » demande ensuite le code à 6 chiffres de l'application d'authentification, ou un code de secours. Elle expire au bout de 5 minutes ou de 5 essais (retour au mot de passe).
- Après 10 essais ratés sur un même compte en 15 minutes, il faut patienter.

### 3. Mot de passe oublié

Saisir son email : un lien **valable 1 heure** permet d'en choisir un nouveau. Toutes les sessions ouvertes sont alors déconnectées, puis on se reconnecte normalement (code de double authentification compris s'il est actif). Le lien confirme aussi l'email d'un compte qui ne l'avait pas encore fait.

### 4. Accueil

Bonjour personnalisé, état de son compte (rôle, double authentification) et de l'application, et raccourcis vers l'administration pour qui y a droit. C'est la page à remplacer par le tableau de bord du projet.

### 5. Gérer son compte — « Mon profil » (menu du compte, en haut à droite)

- **Informations** : prénom et nom (l'email sert d'identifiant et ne change pas ici).
- **Mot de passe** : le changer demande le mot de passe actuel et déconnecte les autres appareils.
- **Double authentification**, recommandée : en plus du mot de passe, un code d'une application d'authentification (Google Authenticator, 1Password, Authy…).
  1. « Activer la double authentification » affiche un QR code (et la clé, à saisir à la main si besoin).
  2. Scanner, puis saisir le code affiché par l'application pour confirmer.
  3. Noter les 8 **codes de secours** (copier ou télécharger) : affichés une seule fois, chacun remplace le téléphone pour une connexion.
  - La désactiver demande le mot de passe et un code.
- **Supprimer mon compte** : définitif, mot de passe demandé ; le compte et toutes ses données sont effacés.

### 6. Administrer les utilisateurs — page « Utilisateurs » (avec le droit de les voir)

- Tableau de tous les comptes : nom, email, email confirmé ou en attente, double authentification, rôle, droits en plus, date d'inscription.
- **Recherche** sur le nom, l'email, le rôle, un droit ou le statut (« admin », « attente »…), sans tenir compte des accents ; **filtres** par rôle, statut de l'email et droits en plus ; **tri** en cliquant sur un en-tête ; 10 à 100 lignes par page ; colonnes à afficher au choix.
- Selon ses droits : modifier le nom et l'email d'une personne, changer son rôle, lui ajouter des droits, **désactiver sa double authentification** (téléphone et codes de secours perdus) ou supprimer son compte.

### 7. Régler les droits — page « Droits » (avec le droit de les voir)

Une carte par rôle avec les droits cochés. Trois rôles :

| Rôle | Par défaut |
|---|---|
| Utilisateur | Son propre compte seulement |
| Admin | Voir les utilisateurs, modifier leur nom et email, désactiver leur double authentification |
| Super admin | Tout, toujours (non modifiable) |

Un super admin peut changer les droits des rôles Utilisateur et Admin, et ajouter des droits à une personne en particulier (« droits en plus »).

### Bon à savoir

- **Garde-fous** : seul un super admin modifie un super admin ou en nomme un ; personne ne change son propre rôle, ses propres droits ni ne se supprime depuis l'administration ; le dernier super admin ne peut pas supprimer son compte.
- **Emails** envoyés pour l'inscription et le mot de passe oublié uniquement ; un compte qui n'existe pas ne reçoit rien, mais l'écran ne le dit pas (pour ne pas révéler qui a un compte).
- **Sur téléphone et tablette** : les sections passent dans une barre d'onglets en bas de l'écran, le compte reste en haut à droite ; les tableaux masquent leurs colonnes secondaires.

---

## Technique

### Démarrer un nouveau projet depuis ce template

1. Sur GitHub, « Use this template » → nouveau dépôt, puis le cloner.
2. Renommer : `scripts/rename.sh mon-projet "Mon Projet"` (identifiant technique en minuscules, puis nom affiché) : paquets npm, projet Docker, base, cookie de session, nom dans l'interface, les emails et l'application d'authentification.
3. Adapter la marque : couleur primaire (`frontend/app/app.config.ts` et `backend/src/mail/application/templates/layout.ts`), symbole (`frontend/app/components/brand/BrandMark.vue` et `frontend/public/favicon.svg`), texte de la page de connexion (`frontend/app/layouts/auth.vue`).
4. Réécrire la partie 1 de ce README et la première ligne de `CLAUDE.md` pour le projet, puis ajouter ses domaines (voir « Ajouter un domaine »).

### Démarrer

Tout tourne dans Docker (aucun Node nécessaire sur la machine) :

```sh
cp .env.example .env            # facultatif : ports de l'hôte si 3000, 8025 ou 5432 sont pris
docker compose up -d --build
docker compose exec backend npm run user:create -- <email> <mot de passe> <prénom> <nom> super_admin
```

| Service | Adresse |
|---|---|
| Application | http://localhost:3000 (`APP_PORT`) |
| API | http://localhost:3000/api, servie par le front (santé : `/api/health`) |
| Emails (Mailpit) | http://localhost:8025 (`MAIL_PORT`) : tous les emails envoyés en dev y arrivent, aucun ne part |
| Postgres | `localhost:5432` (`DB_PORT`), utilisateur, mot de passe et base `socle` |

### Architecture

Espace de travail npm, un seul lockfile :

- `shared/` — schémas Zod partagés (la même règle valide le formulaire et l'API), types des réponses, rôles et droits (`roles/permissions.ts`), nom de l'appli (`app.ts`).
- `backend/` — API Nest + Drizzle (Postgres), hexagonale : `src/<domaine>/{domain,application,infrastructure}/`, un service par route.
  - `auth` : inscription, confirmation de l'email, connexion et sessions (cookie `httpOnly`, jeton haché en base), double authentification (TOTP RFC 6238 calculé dans `totp.ts`, codes de secours hachés, vérification en attente gardée en mémoire 5 min), mot de passe oublié, profil, suppression du compte, guard global `@Authorize`.
  - `users` : comptes et administration (liste paginée avec recherche sans accents, rôle, droits en plus, 2FA, suppression).
  - `roles` : droits de chaque rôle (défauts dans le code, modifications en base).
  - `mail` : emails transactionnels (port `Mailer`, adaptateurs Mailpit et Brevo, gabarits HTML échappés).
  - `common` : erreurs métier → statuts HTTP, validation Zod, limitation du nombre d'essais (`@RateLimit`), base Drizzle et repository générique.
- `frontend/` — Nuxt (SPA) + Nuxt UI : formulaires générés depuis les schémas partagés (`FormBuilder`), pages privées par défaut, navigation responsive, QR code dessiné dans le navigateur (`uqr`).

### Sources de données et services externes

| Service | Usage | Dev | Prod |
|---|---|---|---|
| Postgres 18.6 | Données | Conteneur `db` | Conteneur `db` (volume) |
| Mailpit | Emails gardés pour les lire | Conteneur `mailpit` (`MAILPIT_URL`) | — |
| Brevo (API transactionnelle) | Envoi des emails | — | `BREVO_API_KEY`, `MAIL_FROM` (sans clé : email seulement écrit dans les logs) |

### Développement

```sh
docker compose exec backend npm run test:cov       # unitaires, intégration et e2e + couverture (100 % exigé)
docker compose exec backend npm test               # unitaires seulement, rapide
docker compose exec backend npm run lint
docker compose exec frontend npm run typecheck
docker compose exec backend npm run db:generate -- --name <nom>   # après un changement de table (migrations appliquées au démarrage)
docker compose exec backend npm run db:studio      # explorer la base (Drizzle Studio)
docker compose exec backend npm run user:create -- <email> <mot de passe> <prénom> <nom> [user|admin|super_admin]
```

#### Ajouter un domaine

Exemple pour des « notes » appartenant chacune à une personne (suivre `users` et `roles` comme modèles) :

1. `shared/src/notes/` : `save-note.dto.ts` (schéma Zod) et `note.dto.ts`, réexportés dans `shared/src/index.ts` ; droits `notes.*` dans `shared/src/roles/permissions.ts` si l'accès dépend du rôle.
2. `backend/src/notes/infrastructure/note.table.ts` (`userId` avec `onDelete: 'cascade'`), exporté dans `common/infrastructure/database/schema.ts`, puis `npm run db:generate -- --name add_notes`.
3. `domain/` (entité, `NewNote`, port `NoteRepository`, erreurs), `infrastructure/` (adaptateur Drizzle, controller), `application/` (un service par route), `notes.module.ts` importé dans `app.module.ts`.
4. Tests : `InMemoryNoteRepository` dans `test/fakes/`, specs unitaires des services, intégration de l'adaptateur, e2e des routes.
5. Front : page dans `frontend/app/pages/`, entrée dans le tableau `nav` de `layouts/default.vue`, section dans la partie 1 de ce README.

Versions fixées partout (Node 26.10.0, Postgres 18.6, Mailpit 1.31.4, dépendances npm exactes) : une mise à jour est un changement volontaire (changer la version, régénérer le lockfile, `docker compose up -d --build -V`, puis toutes les vérifications ci-dessus).

Règles de code, de tests et checklist avant commit : [`CLAUDE.md`](CLAUDE.md). Les hooks de `.claude/` rappellent cette checklist à Claude Code avant chaque commit.

### Production

Image unique construite par la CI, servie derrière un reverse proxy HTTPS (Caddy, Nginx…) qui renvoie vers `127.0.0.1:APP_PORT` ; l'API passe par le front sous `/api`, base et API ne sont pas exposées. Migrations appliquées au démarrage de l'API.

À chaque push, `.github/workflows/ci.yml` lance lint, typecheck et tests. Sur `main`, si la variable de dépôt `DEPLOY` vaut `true`, il publie l'image sur `ghcr.io/<compte>/<dépôt>` (tags `latest` et commit), copie `docker-compose.prod.yml` sur le serveur, y fait `pull` puis `up -d` et retire les anciennes images. Le serveur ne contient que `docker-compose.prod.yml` et `.env` : ni code, ni build.

Mise en place, une fois :

1. Serveur : Docker installé, un dossier pour l'appli (ex. `~/mon-projet`) avec un `.env` rempli depuis `.env.example` (`DOMAIN`, `POSTGRES_PASSWORD`, `APP_PORT`).
2. Reverse proxy : par exemple Caddy, `mon-domaine.fr { reverse_proxy 127.0.0.1:3000 }`.
3. Clé SSH de la CI : `ssh-keygen -t ed25519 -f ci -N ''`, ajouter `ci.pub` à `~/.ssh/authorized_keys` du serveur.
4. GitHub → Settings → Environments → `production` :
   - secrets `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` (contenu de `ci`), `SSH_KNOWN_HOSTS` (sortie de `ssh-keyscan <hôte>`), `BREVO_API_KEY` ;
   - variables `APP_DIR` (dossier de l'appli sur le serveur) et `MAIL_FROM` (expéditeur validé dans Brevo, domaine authentifié par DNS).
   Clé Brevo, expéditeur et nom de l'image sont recopiés dans le `.env` du serveur à chaque déploiement.
5. Variable de dépôt `DEPLOY` = `true` (Settings → Secrets and variables → Actions → Variables), puis push sur `main`.
6. Premier super admin : sur le serveur, `docker compose -f docker-compose.prod.yml exec backend npm run user:create -- <email> <mot de passe> <prénom> <nom> super_admin`.

Revenir à une version : sur le serveur, `IMAGE_TAG=<commit> docker compose -f docker-compose.prod.yml up -d`.

Limites connues (commentaires `ponytail:` dans le code) : limitation des essais et vérifications 2FA en attente gardées en mémoire (une seule instance de l'API), sessions expirées jamais purgées, clé 2FA en clair en base, recherche d'utilisateurs sans index (quelques milliers de comptes).

## Licence

[MIT](LICENSE)
