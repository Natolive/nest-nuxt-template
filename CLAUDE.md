# Socle — règles projet

Socle : template d'application web (Nest + Nuxt + Postgres, tout dans Docker) avec les comptes déjà faits : inscription confirmée par email, connexion, mot de passe oublié, double authentification, profil, suppression de compte, rôles et droits, administration des utilisateurs. Un nouveau projet part d'ici (`scripts/rename.sh`, voir README) puis ajoute ses domaines en suivant les règles ci-dessous.

## Général

- Tout passe par Docker (`docker compose exec <backend|frontend> ...`), jamais `npm` sur l'hôte.
- Versions toutes fixées : dépendances npm exactes (`.npmrc` `save-exact=true`, jamais de `^` ni `~`), images Docker à l'étiquette exacte (`Dockerfile`, `docker-compose*.yml`, `.github/workflows/ci.yml`), jamais `latest`. Nouvelle dépendance = `docker compose exec <service> npm install <paquet>` puis `docker compose up -d --build -V`. Mise à jour = volontaire : changer la version partout, régénérer le lockfile, reconstruire, puis tests, lint, typecheck et navigateur.
- TypeScript reste en 6.x tant que la 7 n'a pas d'API de compilation : Nest CLI et `vue-tsc` en ont besoin.
- Workspace npm : `shared/` (DTO Zod et code commun), `backend/` (Nest + Drizzle, hexagonal), `frontend/` (Nuxt UI, SPA), un seul lockfile à la racine.
- Un DTO = `shared/src/<domaine>/<nom>.dto.ts` (un schéma + ses types inférés, ou une interface), réexporté dans `shared/src/index.ts` ; dans `shared/` : imports relatifs en `.ts`, pas d'`enum`/`namespace` (chargé sans compilation).
- La validation vit uniquement dans le schéma partagé, messages en français qui disent comment corriger.
- Nom de l'appli = `APP_NAME` (`shared/src/app.ts`), jamais écrit en dur ailleurs ; identifiant technique `socle` (paquets, Docker, base, cookie) changé par `scripts/rename.sh`.
- Code en anglais, commentaires et textes d'interface en français (tutoiement).
- Organiser par domaine en dossiers, jamais tout dans un fichier : un fichier par service, DTO, type, erreur ou décorateur exporté.
- Pas d'abstraction « pour plus tard » ; raccourci assumé = commentaire `ponytail:` qui dit sa limite et quand y revenir.

## Back

- Hexagonal : `src/<domaine>/{domain,application,infrastructure}/` + `<domaine>.module.ts` importé dans `app.module.ts`, transverse dans `src/common/`.
- `domain/` : entités, ports (classes abstraites) et erreurs métier, sans import Nest ni Drizzle ; entité, type `NewXxx` et mapper vers DTO (`toXxxDto`) chacun dans son fichier.
- Un service par route : `application/<action>.service.ts`, classe `<Action>Service` avec une seule méthode `execute(...)`, déclarée dans `providers` du module. Logique partagée : fonction dans son fichier (`hashToken`, `findManageableUser`), ou service `@Injectable` interne s'il a des dépendances (`OpenSessionService`), exporté si un autre module s'en sert.
- Erreur métier = `domain/errors/<nom>.error.ts`, sous-classe d'une erreur de `common/domain/errors/` (traduite en statut HTTP par `DomainErrorFilter`), jamais d'exception HTTP dans un service.
- Repository = port qui étend `BaseRepository` + adaptateur qui étend `DrizzleRepository`, liés dans le module (`{ provide: Port, useClass: Adapter }`) ; entité absente = `orThrow(await repo.findById(id), XxxNotFoundError)`.
- Controllers dans `infrastructure/http/`, body (et query d'une liste) validé par `ZodValidationPipe` avec un schéma `@socle/shared`, paramètre `:id` par `ParseUUIDPipe`.
- Route protégée = `@Authorize()` (connecté : son propre compte) ou `@Authorize('<catégorie>.<action>')` (droit exigé) ; guard global `SessionGuard` (401 sans session, 403 sans droit) ; sans décorateur, la route est publique ; `@CurrentUser()` donne la personne connectée (`UserDto`, droits effectifs compris).
- Ressource d'une personne (ce qu'elle a créé) : celle d'un autre compte répond comme inexistante (404).
- Table Drizzle dans `<domaine>/infrastructure/*.table.ts`, exportée dans `common/infrastructure/database/schema.ts`, puis `docker compose exec backend npm run db:generate -- --name <nom>` (migrations appliquées au démarrage) ; table liée à `users` = `onDelete: 'cascade'` (supprimer un compte efface ses données).
- Imports relatifs en `.js` (ESM).
- Sources externes (API tierces) : derrière un port dans `domain/`, adaptateur HTTP dans `infrastructure/`, jamais de `fetch` ailleurs.

### Comptes et sécurité

- Mots de passe : `PasswordHasher` (scrypt) uniquement. Jetons (session, liens par email, codes de secours) stockés hachés (`hashToken`), jamais en clair ; lien par email = jeton aléatoire, à usage unique, avec une date d'expiration.
- Route publique qui envoie un email ou teste un mot de passe ou un code = `@RateLimit(...)` (par email et/ou par IP).
- Erreurs qui ne révèlent pas quels comptes existent (connexion, mot de passe oublié) : même réponse dans les deux cas.
- Action sensible sur son compte (changer de mot de passe, couper la 2FA, supprimer le compte) = mot de passe actuel redemandé (`WrongPasswordError`, 400 : la session reste valable).
- 2FA : codes TOTP uniquement via `totp.ts` (RFC 6238, testé sur ses vecteurs) et `checkSecondFactor` (code de l'application ou de secours, ce dernier consommé) ; connexion en deux temps via `TwoFactorChallenges` (`POST /auth/login` renvoie `{ user }` ou `{ challenge }`). Aucun chemin n'ouvre de session sans la 2FA quand elle est active (le lien « mot de passe oublié » ne connecte pas).
- Email : template `src/mail/application/templates/<nom>.mail.ts` (cadre `layout()`, valeurs via `html\`\`` échappées), envoyé par `mailer.send(...)` avec `MailModule` importé ; jamais de HTML ni d'appel au fournisseur ailleurs. Mailpit en dev (`MAILPIT_URL`), Brevo en prod.

### Rôles et droits

- Tout vit dans `shared/src/roles/permissions.ts` (droits, libellés, catégories, rôles, droits par défaut de chaque rôle) : s'y référer plutôt que les recopier.
- Un droit par action, nommé `<catégorie>.<action>` (`users.read`, `users.update_role`) ; jamais de droit fourre-tout type `manage`. Ce qui touche à son propre compte ne demande aucun droit (`@Authorize()`).
- Nouvelle action protégée = nouveau droit dans `PERMISSIONS` + `PERMISSION_LABELS`, et dans `DEFAULT_ROLE_PERMISSIONS` des rôles qui l'ont par défaut ; nouvelle catégorie = libellé dans `PERMISSION_CATEGORY_LABELS`.
- Droits effectifs = droits du rôle + `users.extra_permissions` de la personne, renvoyés dans `UserDto.permissions` ; `super_admin` a toujours tout et ses droits ne se modifient pas.
- `role_permissions` ne stocke que ce qu'un admin a modifié ; sans ligne, le défaut du code s'applique (nouveau droit = pas de migration). Droit supprimé ou renommé = migration qui nettoie `role_permissions` et `users.extra_permissions`.
- Règles vérifiées côté API et reprises à l'écran : seul un super admin touche à un super admin ou nomme un super admin ; personne ne modifie son propre rôle, ses droits ni sa 2FA depuis l'administration, ni ne s'y supprime ; le dernier super admin ne supprime pas son compte.
- Premier super admin : `npm run user:create -- <email> <mot de passe> <prénom> <nom> super_admin` (`backend/src/create-user.ts`).

## Tests (`backend/test/`)

- Jamais de `*.spec.ts` à côté du code ; imports via les alias `@src/*` et `@test/*`, réservés aux tests.
- `test/unit/` reproduit l'arborescence de `src/` : service instancié à la main avec les fakes de `test/fakes/` (`InMemoryXxxRepository`, `FakePasswordHasher`, `FakeMailer` qui garde les emails, `lastToken()` et `failing`), jamais de mocks ni de `Test.createTestingModule` ; câblage commun dans le `setup.ts` du dossier ; adaptateur HTTP testé avec `fetch` remplacé (`vi.stubGlobal`).
- `test/integration/` : adaptateurs Drizzle sur la vraie base (`connect()` de `test/integration/database.ts`), données uniques supprimées en `afterAll` ; ce qui est partagé (droits des rôles) est remis à la fin.
- `test/e2e/` : parcours HTTP complet (supertest) sur la vraie base, `Mailer` et ports externes remplacés par leurs fakes (`overrideProvider`) ; données créées avec un email unique et supprimées en `afterAll`. Les fichiers tournent en parallèle sur la même base : chaque test isole ses données par un horodatage préfixé, jamais un total global.
- Nouveau repository = son `InMemoryXxxRepository` (qui étend `InMemoryRepository`) ; nouveau code = son test dans la couche qui convient (service → unitaire, adaptateur → intégration, route → e2e), jamais une exclusion de couverture.
- `npm run test:cov` exige 100 % des lignes, instructions et fonctions ; seules les branches générées par les décorateurs Nest restent non couvertes.

## Front

- Composant Nuxt UI (`U*`) d'abord, icônes `i-lucide-*` ; composants rangés par dossier, fichier préfixé par le dossier (`form/FormBuilder.vue`).
- SPA (`ssr: false`) : pas de code qui suppose un rendu serveur. L'API est servie par le front sous `/api` (proxy `routeRules`, dev comme prod) : appels via `useApi()`, jamais d'URL d'API en dur.
- Navigation = tableau `nav` de `layouts/default.vue` (menu en haut à partir de `lg`, barre d'onglets en bas en dessous, `short` pour le libellé court, `permission` pour masquer une section) ; nouvelle section = une entrée dans ce tableau.
- Pages privées par défaut (`auth.global.ts`), `definePageMeta({ guest: true })` pour les visiteurs, `definePageMeta({ permission: '…' })` pour une page qui demande un droit ; action masquée si `!can('…')` (`useAuth()`).
- Compte connecté et tout ce qui passe par `/auth` via `useAuth()`, jamais d'appel direct à `/auth` ailleurs ; erreur affichée avec `apiErrorMessage(e)` dans un toast ; bouton = verbe d'action repris dans le toast.
- Formulaire = `FormBuilder` + schéma `@socle/shared`, jamais de `validate` à la main.
- Liste administrable = `UTable` en `manualSorting` + `UPagination`, recherche (après 300 ms de frappe), filtres, tri et page envoyés à l'API (voir `admin/users.vue`) ; colonne secondaire masquée sur petit écran via `meta.class` (classe Tailwind écrite en entier, jamais interpolée).
- Action qui retire quelque chose (suppression, désactivation) = `UModal` de confirmation qui dit ce qui part.
- Thème clair uniquement (`ui.colorMode: false`), couleur primaire dans `app.config.ts` (la reporter dans `mail/application/templates/layout.ts`) ; libellés Nuxt UI en français (`<UApp :locale="fr">`).
- Grille de page en une colonne sous un breakpoint = `grid-cols-[minmax(0,1fr)]`. Vérifier une page à 390 px et 820 px (pas de défilement horizontal) avant de dire « fini ».
- Marque : `BrandLogo` (symbole + nom) ou `BrandMark` (symbole seul), favicon `public/favicon.svg` à garder identique au symbole, `play` pour l'animer à l'affichage (connexion seulement), sinon il s'anime au survol du lien qui le contient ; titres de page en `font-display` ; nom de l'appli dans les titres d'onglet via `titleTemplate` (`nuxt.config.ts`), une page ne donne que son titre.
- Date du jour côté navigateur = date locale (`toLocaleDateString('en-CA')`), jamais `toISOString()` ; dates affichées via `utils/format.ts`.
- Animation uniquement en réponse à une action (navigation, envoi), classes de `main.css` ou `<style scoped>` en fin de fichier, toujours coupée sous `prefers-reduced-motion` ; page à racine unique, sans commentaire HTML à côté (transition de page).

## Documentation

`README.md` en deux parties, dans cet ordre :

1. **Pour l'utilisateur** (sans jargon de code) : objectif de l'appli, puis « Ce que fait l'application », une section par page ou usage, puis « Bon à savoir » (limites, règles en clair).
2. **Technique** : démarrer, architecture (un point par domaine du back), sources de données, développement, production.

À mettre à jour dans la même modification que le code :

| Changement | Où |
|---|---|
| Nouvelle page, nouveau champ, nouvelle action à l'écran | README partie 1, section de la page (créer la section si nouvelle page) |
| Règle métier ou limite visible | README partie 1, section concernée ou « Bon à savoir » |
| Nouveau domaine back, nouvelle source de données, nouveau service Docker, variable d'environnement | README partie 2 (architecture, sources, adresses, production) et `.env.example` |
| Nouvelle commande de dev | README partie 2, « Développement » |
| Nouvelle convention de code, de test ou de front | Ce fichier, section concernée |
| Fonction retirée ou renommée | Supprimer ou renommer partout (README, ce fichier), jamais laisser un ancien libellé |

## Avant de dire « fini » ou de commit

- Documentation à jour selon le tableau ci-dessus (un hook le rappelle avant chaque commit et en fin de réponse s'il reste des changements).
- `docker compose exec backend npm run test:cov` vert (tests + couverture 100 %) et `docker compose exec backend npm run lint` sans erreur.
- Front modifié = `docker compose exec frontend npm run typecheck` sans erreur, puis vérifié dans le navigateur (le typecheck ne voit pas une erreur de template).
- Commit en français, une ligne qui dit ce qui change pour l'utilisateur. La CI (`.github/workflows/ci.yml`) refait lint, typecheck et tests à chaque push ; push sur `main` avec `DEPLOY=true` = déploiement en prod, seulement sur demande.
