# Gristips

Gristips est une plateforme d'automatisation pour vos documents Grist, réservée aux agents publics de l'administration française. L'application permet de créer des automatisations avancées comme la synchronisation périodique entre documents, la copie automatique de tables selon des règles personnalisées, et la gestion de workflows complexes.

## 🚀 Fonctionnalités

### ✅ Implémentées

- **Authentification ProConnect** : Connexion sécurisée via le service d'authentification de l'État français
- **Interface DSFR** : Interface utilisateur conforme au Système de Design de l'État français
- **Gestion des agents publics** : Vérification automatique du statut d'agent public via ProConnect
- **Dashboard d'administration** : Interface de gestion pour les agents publics authentifiés
- **Gestion de sessions avancée** : Sessions sécurisées avec timeout automatique et renouvellement
- **Validation de configuration** : Vérification automatique de la configuration ProConnect
- **Middleware de sécurité** : Protection automatique des routes selon le statut utilisateur
- **Gestion d'erreurs** : Système d'erreurs structuré avec logging et pages dédiées
- **Tests complets** : Suite de tests unitaires, composants et intégration

### 🔄 À venir

- **Automatisations Grist** : Outils d'automatisation pour vos documents Grist
- **Workflows personnalisés** : Configuration de workflows complexes avec conditions
- **Intégrations API** : Connexions avec d'autres services gouvernementaux
- **Tableau de bord avancé** : Statistiques et monitoring des automatisations

## 🛠 Stack Technique

### Frontend

- **Next.js 15.5.0** avec Pages Router (pas App Router)
- **React 19.1.0** et React DOM 19.1.0
- **TypeScript 5** pour le typage statique
- **@codegouvfr/react-dsfr 1.26.0** - Système de Design de l'État français
- **Emotion** (@emotion/react 11.14.0, @emotion/server 11.11.0, @emotion/styled 11.14.1) pour CSS-in-JS
- **tss-react 4.9.19** pour les styles TypeScript-safe
- **@mui/material 7.3.1** pour les composants additionnels

### Backend & Base de données

- **NextAuth.js 4.24.11** pour l'authentification
- **Prisma 6.14.0** comme ORM
- **PostgreSQL 15** comme base de données (via Docker)
- **@next-auth/prisma-adapter 1.0.7** pour l'intégration NextAuth/Prisma

### Sécurité & Authentification

- **jose 6.0.13** pour la vérification des tokens JWT ProConnect
- **jsonwebtoken 9.0.2** pour la manipulation des tokens JWT
- **ProConnect** comme provider d'authentification OAuth2/OpenID Connect

### Tests

- **Vitest 3.2.4** comme framework de test
- **@testing-library/react 16.3.0** pour les tests de composants
- **@testing-library/jest-dom 6.8.0** pour les matchers Jest
- **@testing-library/user-event 14.6.1** pour les interactions utilisateur
- **jsdom 26.1.0** comme environnement de test

## 📋 Prérequis

- **Node.js** 18.0.0 ou supérieur
- **npm**, **yarn**, **pnpm** ou **bun**
- **Docker** et **Docker Compose** (pour la base de données PostgreSQL)
- **Compte ProConnect** pour l'authentification (agents publics uniquement)

## ⚙️ Configuration du build

### Next.js Configuration

Le projet utilise une configuration Next.js personnalisée (`next.config.ts`) :

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true, // Mode strict React activé
  webpack: (config) => {
    // Support des fichiers .woff2 pour DSFR
    config.module.rules.push({
      test: /\.woff2$/,
      type: "asset/resource",
    });
    return config;
  },
  // Transpilation des packages DSFR et tss-react
  transpilePackages: ["@codegouvfr/react-dsfr", "tss-react"],
};
```

### TypeScript Configuration

Configuration TypeScript (`tsconfig.json`) :

- **Target** : ES2017
- **Module** : ESNext avec bundler resolution
- **Strict mode** : Activé
- **Path mapping** : `@/*` vers `./src/*`
- **JSX** : preserve (géré par Next.js)

### ESLint Configuration

Configuration ESLint moderne (`eslint.config.mjs`) avec Flat Config :

```javascript
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/test/**",
      "**/*.test.ts",
      "**/*.test.tsx",
    ],
  },
];
```

- **Extensions** : `next/core-web-vitals`, `next/typescript`
- **Ignores** : Fichiers de build, tests, et fichiers générés
- **Compatibilité** : Support des configurations ESLint legacy via `@eslint/eslintrc`

### Configuration des Tests

Le projet utilise **Vitest** avec deux configurations :

**Configuration principale** (`vitest.config.ts`) :

- **Environnement** : jsdom pour les tests de composants React
- **Plugins** : @vitejs/plugin-react pour le support JSX
- **Setup** : `src/test/setup.ts` pour la configuration globale
- **Alias** : `@/*` vers `./src/*`

**Configuration tests unitaires** (`vitest.config.unit.ts`) :

- **Inclut** : Tests dans `src/test/lib/` et `src/test/integration/`
- **Exclut** : Tests de composants dans `src/test/pages/`

## 🚀 Installation et Configuration

### 1. Cloner le projet

```bash
git clone <repository-url>
cd gristips
```

### 2. Installer les dépendances

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### 3. Configuration de l'environnement

Copiez le fichier d'exemple et configurez vos variables d'environnement :

```bash
cp .env.example .env.local
```

Éditez `.env.local` avec vos vraies valeurs ProConnect :

```env
# ProConnect Configuration
PROCONNECT_CLIENT_ID=your_proconnect_client_id_here
PROCONNECT_CLIENT_SECRET=your_proconnect_client_secret_here
PROCONNECT_DOMAIN=fca.integ01.dev-agentconnect.fr
PROCONNECT_ISSUER=https://fca.integ01.dev-agentconnect.fr/api/v2

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5433/gristips_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=gristips_dev
```

> ⚠️ **Important** : Remplacez `your_proconnect_client_id_here` et `your_proconnect_client_secret_here` par vos vraies valeurs ProConnect obtenues sur le portail partenaires. Le domaine `fca.integ01.dev-agentconnect.fr` est configuré pour l'environnement d'intégration avec l'issuer `/api/v2`.

### 4. Configuration ProConnect

Pour obtenir vos identifiants ProConnect :

1. **Inscription sur le portail partenaires**

   - Rendez-vous sur le [portail partenaires ProConnect](https://partenaires.proconnect.gouv.fr/)
   - Créez un compte avec votre adresse email professionnelle (.gouv.fr)

2. **Création d'une application**

   - Créez une nouvelle application dans votre espace partenaire
   - Renseignez les informations de votre service

3. **Configuration des URLs de callback**

   - **Développement** : `http://localhost:3000/api/auth/callback/proconnect`
   - **Production** : `https://votre-domaine.gouv.fr/api/auth/callback/proconnect`

4. **Récupération des identifiants**

   - Notez votre `CLIENT_ID` (format UUID)
   - Notez votre `CLIENT_SECRET` (chaîne sécurisée)
   - Configurez l'environnement ProConnect :
     - **Intégration/Développement** : `https://fca.integ01.dev-agentconnect.fr/api/v2`
     - **Production** : `https://auth.agentconnect.gouv.fr/api/v2`

   > **Note** : Le fichier `.env.example` utilise l'environnement d'intégration par défaut avec le domaine `fca.integ01.dev-agentconnect.fr` et l'issuer `/api/v2`, adapté pour le développement local.

5. **Génération du secret NextAuth**
   ```bash
   # Générer un secret sécurisé
   openssl rand -base64 32
   ```

### 5. Démarrage de la base de données

Lancez PostgreSQL avec Docker Compose :

```bash
docker-compose up -d
```

Vérifiez que PostgreSQL fonctionne :

```bash
docker-compose ps
```

**Configuration Docker** :

- **Image** : PostgreSQL 15
- **Port** : 5433 (pour éviter les conflits avec PostgreSQL local sur le port 5432)
- **Base de données** : `gristips_dev`
- **Utilisateur** : `postgres` / `password`
- **Volume persistant** : `postgres_data` (les données survivent aux redémarrages)

### 6. Configuration de la base de données

Générez le client Prisma et exécutez les migrations :

```bash
# Générer le client Prisma
npx prisma generate

# Exécuter les migrations
npx prisma migrate deploy

# (Optionnel) Visualiser la base de données
npx prisma studio
```

### 7. Démarrage de l'application

```bash
# Développement
npm run dev

# Production
npm run build
npm run start
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

## 🗄 Structure de la base de données

La base de données utilise PostgreSQL 15 avec Prisma 6.14.0 comme ORM. Le schéma est défini dans `prisma/schema.prisma`.

### Tables principales

- **users** : Informations des utilisateurs

  - `id` (String, CUID) - Identifiant unique
  - `email` (String, unique) - Email de l'utilisateur
  - `name` (String) - Nom complet
  - `isPublicAgent` (Boolean) - Statut d'agent public (mappé vers `is_public_agent`)
  - `organization` (String, optionnel) - Organisation d'appartenance
  - `createdAt`, `updatedAt` - Timestamps (mappés vers `created_at`, `updated_at`)

- **accounts** : Comptes liés aux providers d'authentification (ProConnect)

  - `id`, `userId` (mappé vers `user_id`), `type`, `provider`, `providerAccountId` (mappé vers `provider_account_id`)
  - `refresh_token`, `access_token`, `expires_at`
  - `token_type`, `scope`, `id_token`, `session_state`
  - `createdAt`, `updatedAt` - Timestamps (mappés vers `created_at`, `updated_at`)

- **sessions** : Sessions utilisateur actives

  - `id`, `sessionToken` (mappé vers `session_token`, unique), `userId` (mappé vers `user_id`), `expires`
  - `createdAt`, `updatedAt` - Timestamps (mappés vers `created_at`, `updated_at`)
  - Gestion automatique par NextAuth.js

- **verification_tokens** : Tokens de vérification
  - `identifier`, `token` (unique), `expires`
  - Mappé vers `verification_tokens`

### Configuration Docker

**PostgreSQL 15** via Docker Compose (`docker-compose.yml`) :

- **Image** : PostgreSQL 15
- **Port** : 5433 (pour éviter les conflits avec PostgreSQL local sur le port 5432)
- **Base de données** : `gristips_dev`
- **Utilisateur** : `postgres` / `password`
- **Volume persistant** : `postgres_data` (les données survivent aux redémarrages)
- **Restart policy** : `unless-stopped`

### Relations

- Un utilisateur peut avoir plusieurs comptes (accounts) et sessions
- Les comptes et sessions sont liés à un utilisateur via `userId`
- Suppression en cascade : si un utilisateur est supprimé, ses comptes et sessions le sont aussi
- Contraintes d'unicité : `[provider, providerAccountId]` pour les comptes, `sessionToken` pour les sessions

## 🔧 Scripts disponibles

```bash
# Développement
npm run dev          # Démarre le serveur de développement (met à jour les icônes DSFR automatiquement)

# Production
npm run build        # Build l'application pour la production (met à jour les icônes DSFR automatiquement)
npm run start        # Démarre l'application en mode production

# Tests
npm run test         # Exécute tous les tests (vitest --run)
npm run test:unit    # Exécute uniquement les tests unitaires et d'intégration
npm run test:watch   # Exécute les tests en mode watch (vitest)
npm run test:ui      # Interface graphique pour les tests (vitest --ui)
npm run test:coverage # Génère le rapport de couverture (vitest --coverage)

# Qualité de code
npm run lint         # Vérifie le code avec ESLint

# Base de données
npx prisma generate     # Génère le client Prisma
npx prisma migrate dev  # Crée et applique une nouvelle migration
npx prisma migrate deploy # Applique les migrations en production
npx prisma studio       # Interface graphique pour la base de données
npx prisma db push      # Synchronise le schéma sans migration

# Docker
docker-compose up -d    # Démarre PostgreSQL en arrière-plan
docker-compose ps       # Vérifie le statut des conteneurs
docker-compose logs postgres # Affiche les logs PostgreSQL
docker-compose down     # Arrête et supprime les conteneurs
```

> **Note** : Les scripts `predev` et `prebuild` mettent automatiquement à jour les icônes DSFR avant le démarrage du serveur de développement ou la construction de l'application.

## 🌍 Environnements

### Développement

- **ProConnect** : Environnement d'intégration
  - Domain : `fca.integ01.dev-agentconnect.fr`
  - Issuer : `https://fca.integ01.dev-agentconnect.fr`
- **Base de données** : PostgreSQL 15 local via Docker (port 5433)
- **URL** : `http://localhost:3000`
- **Tests** : Vitest avec jsdom et @testing-library

### Production

- **ProConnect** : Environnement de production
  - Issuer : `https://auth.agentconnect.gouv.fr/api/v2`
- **Base de données** : PostgreSQL hébergé
- **URL** : Votre domaine en `.gouv.fr`
- **HTTPS** : Obligatoire en production
- **Sécurité** : Cookies sécurisés, validation JWT, middleware de protection

## 🧪 Tests

Le projet utilise **Vitest 3.2.4** comme framework de test avec une configuration complète pour les tests unitaires, de composants et d'intégration.

### Types de tests

- **Tests unitaires** : Fonctions utilitaires et services (`src/test/lib/`)

  - `auth.test.ts` : Tests des utilitaires d'authentification
  - `proconnect.test.ts` : Tests de l'intégration ProConnect

- **Tests de composants** : Pages et composants React (`src/test/pages/`)

  - `admin.test.tsx` : Tests de la page d'administration
  - `auth/signin.test.tsx` : Tests de la page de connexion
  - `auth/access-denied.test.tsx` : Tests de la page d'accès refusé

- **Tests d'intégration** : Flux complets d'authentification (`src/test/integration/`)
  - `auth-flow.test.ts` : Tests du flux d'authentification complet
  - `session-management.test.ts` : Tests de la gestion des sessions
  - `redirect-flow.test.ts` : Tests des redirections selon le statut utilisateur

### Configuration des tests

**Configuration principale** (`vitest.config.ts`) :

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  optimizeDeps: {
    include: ["@codegouvfr/react-dsfr"],
  },
  ssr: {
    noExternal: ["@codegouvfr/react-dsfr"],
  },
});
```

**Configuration tests unitaires** (`vitest.config.unit.ts`) :

```typescript
export default defineConfig({
  // ... configuration de base
  test: {
    include: ["src/test/lib/**/*.test.ts", "src/test/integration/**/*.test.ts"],
    exclude: ["src/test/pages/**/*.test.tsx"], // Exclut les tests de composants
  },
});
```

### Outils de test

- **@testing-library/react 16.3.0** : Tests de composants React
- **@testing-library/jest-dom 6.8.0** : Matchers Jest pour le DOM
- **@testing-library/user-event 14.6.1** : Simulation d'interactions utilisateur
- **jsdom 26.1.0** : Environnement DOM pour les tests

### Exécution des tests

```bash
# Tests en une fois
npm run test

# Tests unitaires uniquement
npm run test:unit

# Tests en mode watch
npm run test:watch

# Interface graphique
npm run test:ui

# Couverture de code
npm run test:coverage
```

### Mocking et configuration

Les tests utilisent des mocks pour :

- **NextAuth.js** : Sessions et authentification
- **ProConnect** : Réponses API et claims
- **Composants DSFR** : Simplification pour les tests
- **Variables d'environnement** : Configuration de test isolée

Le fichier `src/test/setup.ts` configure l'environnement de test avec tous les mocks nécessaires.

## 🔒 Sécurité

### Authentification ProConnect

L'application utilise ProConnect (ex-AgentConnect) pour l'authentification :

- **OpenID Connect** avec vérification JWT via jose 6.0.13
- **Scopes requis** : `openid`, `given_name`, `usual_name`, `email`, `organizational_unit`, `belonging_population`
- **Vérification du statut d'agent public** via le claim `belonging_population` (doit contenir "agent")
- **Validation des tokens** avec les clés publiques JWKS de ProConnect

### Middleware de sécurité

Le middleware Next.js (`middleware.ts`) protège automatiquement les routes :

```typescript
// Configuration des routes
const protectedRoutes = ["/admin"]; // Agents publics uniquement
const authRoutes = ["/auth/signin", "/auth/error", "/auth/access-denied"]; // Pages d'authentification
const publicRoutes = ["/", "/api/auth"]; // Accès libre
```

**Fonctionnement** :

- **Vérification JWT** : Validation du token de session avec `next-auth/jwt`
- **Redirection automatique** : `/auth/signin` si non authentifié
- **Contrôle d'accès** : `/auth/access-denied` si non-agent public pour `/admin/*`
- **Gestion d'erreurs** : Redirection vers `/auth/error` en cas de problème middleware
- **Routes exclues** : `/_next/*`, `/favicon.ico`, `/public/*`, `/api/auth/*`

**Sécurité** :

- Vérification du statut `isPublicAgent` pour les routes administratives
- Préservation de l'URL de destination via `callbackUrl`
- Gestion des erreurs avec logging sécurisé

### Configuration sécurisée

- **HTTPS obligatoire** en production
- **Cookies sécurisés** avec flags `httpOnly`, `secure`, et `sameSite`
- **Sessions JWT** avec expiration automatique (30 jours max, 2h d'inactivité)
- **Validation des variables d'environnement** au démarrage avec `config-validation.ts`
- **Gestion d'erreurs structurée** avec logging sécurisé

## 🐛 Dépannage

### Erreurs courantes

#### 1. Erreur de connexion à la base de données

```
Error: P1001: Can't reach database server
```

**Solutions :**

- Vérifiez que Docker est démarré : `docker-compose ps`
- Redémarrez PostgreSQL : `docker-compose restart postgres`
- Vérifiez la variable `DATABASE_URL` dans `.env.local`
- Assurez-vous que le port 5433 n'est pas utilisé par un autre service

#### 2. Erreur ProConnect "Configuration"

```
Error: Variables d'environnement ProConnect manquantes
```

**Solutions :**

- Vérifiez que `PROCONNECT_CLIENT_ID` et `PROCONNECT_CLIENT_SECRET` sont définis dans `.env.local`
- Assurez-vous que `NEXTAUTH_SECRET` est configuré (générez-en un avec `openssl rand -base64 32`)
- Vérifiez que `PROCONNECT_ISSUER` correspond à votre environnement :
  - Développement/Intégration : `https://fca.integ01.dev-agentconnect.fr/api/v2`
  - Production : `https://auth.agentconnect.gouv.fr/api/v2`
- Vérifiez que `PROCONNECT_DOMAIN` est configuré (pour l'intégration : `fca.integ01.dev-agentconnect.fr`)
- Vérifiez l'URL de callback dans votre configuration ProConnect
- Assurez-vous que vos identifiants ne contiennent pas les valeurs par défaut (`your_proconnect_client_id_here`)
- Vérifiez que `PROCONNECT_ISSUER` inclut bien `/api/v2` à la fin

#### 3. Erreur "Access Denied"

```
Accès refusé - Service réservé aux agents publics
```

**Solutions :**

- Vérifiez que votre compte ProConnect indique bien votre statut d'agent public
- Contactez votre service RH ou informatique pour vérifier vos droits
- En développement, vérifiez que vous utilisez le bon environnement ProConnect

#### 4. Erreur Prisma "Schema not found"

```
Error: Schema not found
```

**Solutions :**

- Exécutez `npx prisma generate`
- Puis `npx prisma migrate deploy`
- Redémarrez l'application

#### 5. Erreurs de build Next.js

```
Error: Module not found: Can't resolve '@codegouvfr/react-dsfr'
```

**Solutions :**

- Vérifiez que toutes les dépendances sont installées : `npm install`
- Nettoyez le cache Next.js : `rm -rf .next`
- Redémarrez le serveur de développement : `npm run dev`

#### 6. Erreurs de tests

```
Error: Cannot assign to 'NODE_ENV' because it is a read-only property
```

**Solutions :**

- Les tests utilisent des mocks pour les variables d'environnement configurés dans `src/test/setup.ts`
- Redémarrez les tests : `npm run test`
- Vérifiez que jsdom est correctement installé : `npm install jsdom --save-dev`
- Pour les tests unitaires uniquement : `npm run test:unit`
- Interface graphique des tests : `npm run test:ui`

#### 7. Erreurs de configuration DSFR

```
Error: Cannot resolve module '@codegouvfr/react-dsfr'
```

**Solutions :**

- Vérifiez que les icônes DSFR sont à jour : `npx react-dsfr update-icons`
- Les scripts `predev` et `prebuild` mettent automatiquement à jour les icônes
- Nettoyez le cache : `rm -rf .next node_modules/.cache`
- Réinstallez les dépendances : `npm ci`

### Logs et debugging

En développement, consultez les logs :

```bash
# Logs de l'application Next.js
npm run dev

# Logs PostgreSQL
docker-compose logs postgres

# Logs des tests
npm run test:watch

# Interface de debug des tests
npm run test:ui
```

### Validation de la configuration

L'application inclut un système de validation automatique de la configuration au démarrage. Utilisez également la page de vérification de configuration :

```
http://localhost:3000/admin/config-check
```

Cette page vérifie :

- **Variables d'environnement ProConnect** : CLIENT_ID, CLIENT_SECRET, DOMAIN, ISSUER
- **Configuration NextAuth.js** : NEXTAUTH_URL, NEXTAUTH_SECRET
- **Connexion à la base de données** : DATABASE_URL et connectivité PostgreSQL
- **Endpoints ProConnect** : Accessibilité des services ProConnect (JWKS, etc.)
- **Scopes et claims** : Configuration des scopes OpenID Connect requis
- **Sécurité** : Validation des secrets et URLs selon l'environnement

**Fonctionnalités de validation** :

- **Validation au démarrage** : Vérification complète lors du lancement de l'application
- **Validation runtime** : Contrôles lors des appels API critiques
- **Messages d'erreur détaillés** : Guidance pour résoudre les problèmes de configuration
- **Environnements multiples** : Support développement, intégration et production
- **Connectivité ProConnect** : Test de la disponibilité des endpoints

La validation s'exécute automatiquement au démarrage et affiche des erreurs détaillées si la configuration est incorrecte. En production, l'application refuse de démarrer avec une configuration invalide.

> **Note importante** : La configuration ProConnect a été mise à jour pour utiliser le nouveau domaine d'intégration `fca.integ01.dev-agentconnect.fr` avec l'issuer `/api/v2`. Assurez-vous que votre fichier `.env.local` utilise les nouvelles variables `PROCONNECT_DOMAIN` et `PROCONNECT_ISSUER` comme indiqué dans `.env.example`.

## 📚 Documentation

### Documentation du projet

- **[Guide de déploiement](./DEPLOYMENT.md)** : Configuration et déploiement en production avec ProConnect
- **[Spécifications techniques](./.kiro/specs/proconnect-authentication/)** : Requirements, design et plan d'implémentation

### Liens utiles

- [Documentation ProConnect](https://partenaires.proconnect.gouv.fr/documentation)
- [Système de Design de l'État (DSFR)](https://www.systeme-de-design.gouv.fr/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs)

### Architecture du projet

```
src/
├── components/          # Composants React réutilisables
│   ├── ErrorBoundary.tsx
│   └── home/           # Composants de la page d'accueil
│       ├── CTASection.tsx
│       ├── FeaturesSection.tsx
│       ├── HeroSection.tsx
│       ├── HowItWorksSection.tsx
│       ├── ProblemSection.tsx
│       └── index.ts
├── lib/                # Utilitaires et services
│   ├── auth/           # Modules d'authentification
│   │   ├── client.ts   # Utilitaires côté client
│   │   ├── index.ts    # Exports principaux
│   │   ├── proconnect.ts # Configuration ProConnect
│   │   ├── server.ts   # Utilitaires côté serveur
│   │   ├── session.ts  # Gestion des sessions
│   │   └── types.ts    # Types d'authentification
│   ├── api/            # Utilitaires API
│   │   ├── client.ts   # Client API avec gestion d'erreurs
│   │   ├── error-handling.ts # Gestion d'erreurs serveur
│   │   └── index.ts    # Exports API
│   ├── validation/     # Validation de configuration
│   │   ├── config.ts   # Validation ProConnect
│   │   └── index.ts    # Exports validation
│   ├── auth.ts         # Utilitaires d'authentification legacy
│   ├── proconnect.ts   # Intégration ProConnect legacy
│   ├── config-validation.ts # Validation de configuration legacy
│   ├── error-handling.ts    # Gestion d'erreurs legacy
│   ├── useSessionManagement.ts # Hook de gestion de session
│   ├── SessionTimeoutWarning.tsx # Composant d'avertissement
│   ├── client-error-handling.ts # Gestion d'erreurs client
│   └── createEmotionCache.ts # Configuration Emotion
├── pages/              # Pages Next.js (Pages Router)
│   ├── _app.tsx        # Configuration globale (DSFR, Emotion, Session)
│   ├── _document.tsx   # Document HTML personnalisé
│   ├── index.tsx       # Page d'accueil
│   ├── admin.tsx       # Dashboard admin
│   ├── admin/
│   │   └── config-check.tsx # Page de vérification config
│   ├── auth/           # Pages d'authentification
│   │   ├── signin.tsx  # Page de connexion ProConnect
│   │   ├── error.tsx   # Page d'erreur d'authentification
│   │   └── access-denied.tsx # Page d'accès refusé
│   └── api/            # API Routes
│       ├── auth/       # Endpoints NextAuth.js
│       │   ├── [...nextauth].ts # Configuration NextAuth
│       │   ├── secure-signout.ts # Déconnexion sécurisée
│       │   └── validate-session.ts # Validation de session
│       ├── health/     # Health checks
│       │   └── proconnect.ts # Vérification ProConnect
│       └── hello.ts    # API exemple
├── styles/             # Styles CSS
│   ├── globals.css     # Styles globaux
│   └── Home.module.css # Styles page d'accueil
├── test/               # Tests (unitaires, intégration)
│   ├── lib/            # Tests des utilitaires
│   ├── pages/          # Tests des pages/composants
│   ├── integration/    # Tests d'intégration
│   └── setup.ts        # Configuration des tests
└── types/              # Types TypeScript
    └── next-auth.d.ts  # Extensions NextAuth
```

### Configuration racine

```
├── .env.example        # Variables d'environnement exemple
├── .env.local          # Variables d'environnement locales (non versionnées)
├── .gitignore          # Fichiers ignorés par Git
├── docker-compose.yml  # Configuration PostgreSQL
├── eslint.config.mjs   # Configuration ESLint (Flat Config)
├── middleware.ts       # Middleware Next.js pour la protection des routes
├── next.config.ts      # Configuration Next.js
├── package.json        # Dépendances et scripts
├── prisma/
│   ├── schema.prisma   # Schéma de base de données
│   └── migrations/     # Migrations Prisma
├── tsconfig.json       # Configuration TypeScript
├── vitest.config.ts    # Configuration tests principaux
└── vitest.config.unit.ts # Configuration tests unitaires
```

### Spécifications et implémentation

Consultez les documents de spécification dans `.kiro/specs/proconnect-authentication/` :

- `requirements.md` : Exigences fonctionnelles et cas d'usage
- `design.md` : Architecture technique et conception
- `tasks.md` : Plan d'implémentation détaillé (✅ **Terminé**)

**État d'avancement** : L'authentification ProConnect est entièrement implémentée et testée, incluant :

- ✅ Configuration NextAuth.js avec provider ProConnect personnalisé
- ✅ Vérification du statut d'agent public via `belonging_population`
- ✅ Gestion des sessions sécurisées avec timeout automatique
- ✅ Middleware de protection des routes
- ✅ Pages d'authentification et d'administration
- ✅ Tests unitaires et d'intégration complets
- ✅ Validation de configuration automatique
- ✅ Gestion d'erreurs structurée

## 🤝 Contribution

Ce projet est destiné à l'administration française. Pour contribuer :

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## � LÉtat du projet

### Version actuelle : 0.1.0

**Dernières mises à jour** :

- ✅ **Configuration ProConnect mise à jour** : Migration vers le nouveau domaine d'intégration `fca.integ01.dev-agentconnect.fr`
- ✅ **Authentification ProConnect** : Implémentation complète avec provider OpenID Connect
- ✅ **Validation de configuration** : Système de validation automatique au démarrage
- ✅ **Tests complets** : Suite de tests unitaires, composants et intégration (Vitest)
- ✅ **Interface DSFR** : Pages d'authentification et dashboard conformes au design system
- ✅ **Middleware de sécurité** : Protection automatique des routes selon le statut utilisateur
- ✅ **Gestion d'erreurs** : Système d'erreurs structuré avec logging et pages dédiées

**Prochaines étapes** :

- 🔄 **Automatisations Grist** : Développement des outils d'automatisation
- 🔄 **API Grist** : Intégration avec l'API Grist pour la gestion des documents
- 🔄 **Workflows** : Système de workflows personnalisables
- 🔄 **Monitoring** : Tableau de bord de monitoring des automatisations

### Compatibilité

- **Node.js** : 18.0.0+ (testé avec 18.x et 20.x)
- **Navigateurs** : Tous les navigateurs modernes supportés par Next.js 15
- **Base de données** : PostgreSQL 15+ (compatible 13+)
- **ProConnect** : Environnements intégration et production
- **Docker** : Docker 20.0+ et Docker Compose 2.0+

## 🎯 État du projet

### Version actuelle : 0.1.0

**Dernières mises à jour** :

- ✅ **Configuration ProConnect mise à jour** : Migration vers le nouveau domaine d'intégration `fca.integ01.dev-agentconnect.fr/api/v2`
- ✅ **Authentification ProConnect** : Implémentation complète avec provider OpenID Connect
- ✅ **Validation de configuration** : Système de validation automatique au démarrage
- ✅ **Tests complets** : Suite de tests unitaires, composants et intégration (Vitest)
- ✅ **Interface DSFR** : Pages d'authentification et dashboard conformes au design system
- ✅ **Middleware de sécurité** : Protection automatique des routes selon le statut utilisateur
- ✅ **Gestion d'erreurs** : Système d'erreurs structuré avec logging et pages dédiées

**Prochaines étapes** :

- 🔄 **Automatisations Grist** : Développement des outils d'automatisation
- 🔄 **API Grist** : Intégration avec l'API Grist pour la gestion des documents
- 🔄 **Workflows** : Système de workflows personnalisables
- 🔄 **Monitoring** : Tableau de bord de monitoring des automatisations

### Compatibilité

- **Node.js** : 18.0.0+ (testé avec 18.x et 20.x)
- **Navigateurs** : Tous les navigateurs modernes supportés par Next.js 15
- **Base de données** : PostgreSQL 15+ (compatible 13+)
- **ProConnect** : Environnements intégration et production
- **Docker** : Docker 20.0+ et Docker Compose 2.0+

## 📄 Licence

Ce projet est destiné à un usage interne de l'administration française.
