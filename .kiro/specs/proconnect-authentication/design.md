# Design Document - Authentification ProConnect

## Overview

Cette fonctionnalité implémente un système d'authentification complet utilisant ProConnect (le service d'authentification de l'État français) dans une application Next.js avec react-dsfr. Le système vérifie le statut d'agent public des utilisateurs et les redirige vers l'interface appropriée.

## Architecture

### Architecture Générale

```mermaid
graph TB
    A[Page d'accueil] --> B[Bouton ProConnect]
    B --> C[Service ProConnect]
    C --> D[Callback Handler]
    D --> E{Agent Public?}
    E -->|Oui| F[Page Admin]
    E -->|Non| G[Page d'erreur]
    D --> H[(PostgreSQL)]
    H --> I[Session Store]
```

### Stack Technique

- **Frontend**: Next.js 15 avec Pages Router
- **UI**: react-dsfr (déjà configuré)
- **Base de données**: PostgreSQL
- **ORM**: Prisma (recommandé pour TypeScript)
- **Authentification**: NextAuth.js avec provider ProConnect personnalisé
- **Containerisation**: Docker Compose pour le développement

## Components and Interfaces

### 1. Composants React

#### ProConnectLoginPage

```typescript
interface ProConnectLoginPageProps {
  callbackUrl?: string;
}
```

- Utilise le composant `ProConnectButton` de react-dsfr
- Gère la redirection vers ProConnect

#### AdminPage

```typescript
interface AdminPageProps {
  user: AuthenticatedUser;
}

interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  isPublicAgent: boolean;
  organization?: string;
}
```

#### ErrorPage

```typescript
interface ErrorPageProps {
  errorType: "access_denied" | "authentication_failed";
  message: string;
}
```

### 2. API Routes

#### `/api/auth/[...nextauth].ts`

Configuration NextAuth.js avec provider ProConnect personnalisé

#### `/api/auth/callback/proconnect`

Gestion du callback ProConnect et vérification du statut d'agent public

### 3. Services

#### ProConnectService

```typescript
interface ProConnectConfig {
  clientId: string;
  clientSecret: string;
  issuer: string;
  domain: string;
  endpoints: {
    authorization: string;
    token: string;
    userinfo: string;
    jwks: string; // IMPORTANT: Utilise /jwks, pas /certs
    wellKnown: string;
  };
  scope: string[]; // ["openid", "given_name", "usual_name", "email", "organizational_unit", "belonging_population"]
}

interface ProConnectUserInfo {
  sub: string;
  email: string;
  given_name: string;
  usual_name: string; // ProConnect utilise usual_name, pas family_name
  organizational_unit?: string;
  belonging_population: string[]; // Contient "agent" pour les agents publics
}

// DÉCOUVERTE IMPORTANTE: L'endpoint /userinfo retourne un JWT signé, pas du JSON
interface UserInfoResponse {
  // La réponse est un JWT string qui doit être décodé avec jwt.decode()
  // Contient les mêmes propriétés que ProConnectUserInfo une fois décodé
}
```

#### DatabaseService

```typescript
interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  expires: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id: string;
  email: string;
  name: string;
  isPublicAgent: boolean;
  organization?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Data Models

### Base de données PostgreSQL

#### Table `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_public_agent BOOLEAN NOT NULL DEFAULT false,
  organization VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table `sessions`

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table `accounts` (NextAuth.js)

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_account_id)
);
```

### Schema Prisma

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  isPublicAgent Boolean   @map("is_public_agent") @default(false)
  organization  String?
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  accounts      Account[]
  sessions      Session[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}
```

## Error Handling

### Types d'erreurs

1. **Erreur d'authentification ProConnect**: Redirection vers page d'erreur avec message explicite
2. **Accès refusé (non-agent public)**: Redirection vers page d'erreur spécifique
3. **Erreur de base de données**: Logging et message d'erreur générique
4. **Session expirée**: Redirection automatique vers la page de connexion
5. **Erreur de décodage JWT userinfo**: Gestion spécifique pour les réponses JWT de ProConnect
6. **Erreur de liaison de compte**: Gestion des utilisateurs existants avec email identique

### Stratégie de gestion

- Utilisation de try-catch dans tous les handlers API
- Logging structuré des erreurs avec contexte (user ID, timestamp, action)
- Messages d'erreur utilisateur-friendly
- Fallback vers page d'accueil en cas d'erreur critique
- **Décodage JWT automatique** pour l'endpoint `/userinfo` avec fallback JSON
- **Validation des claims** avec gestion des propriétés manquantes
- **Gestion des erreurs de liaison de compte** avec création automatique si nécessaire
- **Validation de configuration** au démarrage avec messages d'erreur explicites

### Logging structuré

```typescript
// Exemple de logging avec contexte
const logAuthEvent = (
  event: string,
  context: any,
  level: "info" | "warn" | "error" = "info"
) => {
  console[level](`[AUTH] ${event}`, {
    timestamp: new Date().toISOString(),
    ...context,
  });
};

// Usage
logAuthEvent("ProConnect callback received", {
  userId: user.id,
  email: user.email,
  hasPublicAgentClaim: !!userinfo.belonging_population,
});
```

### Corrections spécifiques implémentées

#### Problème JWT userinfo

```typescript
// L'endpoint /userinfo retourne un JWT, pas du JSON
const userinfoText = await userinfoResponse.text();
let userinfo;
try {
  userinfo = JSON.parse(userinfoText);
} catch {
  // Si ce n'est pas du JSON, décoder le JWT
  userinfo = jwt.decode(userinfoText) as any;
}
```

#### Erreurs d'hydratation HTML

- Éviter les balises `<p>` imbriquées dans les composants DSFR
- Utiliser `<span>` et `<br />` à la place dans les CallOut

## Testing Strategy

### Tests unitaires

- Services ProConnect et Database
- Composants React (ProConnectButton, AdminPage, ErrorPage)
- Utilitaires de validation et transformation

### Tests d'intégration

- Flow complet d'authentification
- Vérification du statut d'agent public
- Gestion des sessions et redirections

### Tests end-to-end

- Parcours utilisateur complet avec Playwright
- Test des différents scénarios (agent public, non-agent, erreurs)

## Découvertes techniques importantes

### 1. Endpoint JWKS correct

- ❌ **Incorrect**: `/api/v2/certs`
- ✅ **Correct**: `/api/v2/jwks`

### 2. Réponse de l'endpoint userinfo

- **Problème**: L'endpoint `/userinfo` retourne un JWT signé, pas du JSON simple
- **Solution**: Décodage automatique avec fallback JSON

```typescript
const userinfoText = await userinfoResponse.text();
let userinfo;
try {
  userinfo = JSON.parse(userinfoText); // Essayer JSON d'abord
} catch {
  userinfo = jwt.decode(userinfoText) as any; // Décoder le JWT
}
```

### 3. Configuration des endpoints

- **Issuer correct**: `https://fca.integ01.dev-agentconnect.fr/api/v2`
- **Endpoints basés sur le domaine**: Utiliser la variable `PROCONNECT_DOMAIN`

```typescript
// Configuration complète des endpoints
const endpoints = {
  authorization: `https://${domain}/api/v2/authorize`,
  token: `https://${domain}/api/v2/token`,
  userinfo: `https://${domain}/api/v2/userinfo`, // Retourne un JWT !
  jwks: `https://${domain}/api/v2/jwks`,
  wellKnown: `https://${domain}/api/v2/.well-known/openid-configuration`,
};
```

### 4. Gestion temporaire de isPublicAgent

- **Décision temporaire**: Tous les utilisateurs ProConnect sont considérés comme agents publics (`isPublicAgent = true`)
- **Raison**: Le claim `belonging_population` n'est pas toujours disponible dans l'environnement d'intégration
- **TODO**: Implémenter la vérification réelle via `belonging_population.includes("agent")` plus tard

### 5. Liaison automatique des comptes

- **Problème**: Erreur `OAuthAccountNotLinked` pour les utilisateurs existants
- **Solution**: Gestion manuelle de la liaison dans le callback `signIn`

### 6. Corrections d'hydratation HTML

- **Problème**: Balises `<p>` imbriquées dans les composants DSFR
- **Solution**: Utiliser `<span>` et `<br />` dans les CallOut

```typescript
// ❌ Problématique - cause des erreurs d'hydratation
<CallOut>
  <p>Message avec <p>paragraphe imbriqué</p></p>
</CallOut>

// ✅ Solution - utiliser span et br
<CallOut>
  <span>Message avec <br />saut de ligne</span>
</CallOut>
```

### 7. Gestion des sessions avec renouvellement automatique

- **Implémentation**: Hook `useSessionManagement` pour le renouvellement automatique
- **Seuil**: Renouvellement 1 heure avant expiration
- **Composant**: `SessionTimeoutWarning` pour alerter l'utilisateur

```typescript
// Hook de gestion des sessions
const useSessionManagement = () => {
  const { data: session, update } = useSession();

  useEffect(() => {
    if (session?.expires) {
      const expiresAt = new Date(session.expires).getTime();
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      const oneHour = 60 * 60 * 1000;

      if (timeUntilExpiry < oneHour && timeUntilExpiry > 0) {
        // Renouveler la session
        update();
      }
    }
  }, [session, update]);
};
```

## Configuration

### Variables d'environnement

#### Développement (.env.local)

```env
# ProConnect - Configuration d'intégration
PROCONNECT_CLIENT_ID=your_client_id
PROCONNECT_CLIENT_SECRET=your_client_secret
PROCONNECT_DOMAIN=fca.integ01.dev-agentconnect.fr
PROCONNECT_ISSUER=https://fca.integ01.dev-agentconnect.fr/api/v2

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/gristips_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=gristips_dev

# Optionnel - Validation de configuration
VALIDATE_CONFIG_ON_STARTUP=true
```

#### Production

```env
# ProConnect (production)
PROCONNECT_CLIENT_ID=prod_client_id
PROCONNECT_CLIENT_SECRET=prod_client_secret
PROCONNECT_DOMAIN=auth.proconnect.gouv.fr
PROCONNECT_ISSUER=https://auth.proconnect.gouv.fr/api/v2

# NextAuth (production)
NEXTAUTH_URL=https://your-domain.gouv.fr
NEXTAUTH_SECRET=secure_production_secret

# Database (production)
DATABASE_URL=postgresql://user:password@db-host:5432/gristips_prod

# Production - Validation obligatoire
VALIDATE_CONFIG_ON_STARTUP=true
```

### Docker Compose (développement)

```yaml
version: "3.8"
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: gristips_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Patterns d'implémentation

### 1. Gestion des callbacks NextAuth

```typescript
// Pattern pour les callbacks avec gestion d'erreurs
const callbacks = {
  async signIn({ user, account, profile }) {
    try {
      // Logique de validation et création utilisateur
      return true;
    } catch (error) {
      logAuthEvent("SignIn callback error", { error: error.message }, "error");
      return false;
    }
  },

  async jwt({ token, user, account }) {
    // Enrichissement du token avec les données ProConnect
    if (account && user) {
      token.proconnect = {
        sub: user.id,
        isPublicAgent: user.isPublicAgent,
        organization: user.organization,
      };
    }
    return token;
  },
};
```

### 2. Validation de configuration

```typescript
// Pattern de validation des variables d'environnement
const validateProConnectConfig = () => {
  const required = [
    "PROCONNECT_CLIENT_ID",
    "PROCONNECT_CLIENT_SECRET",
    "PROCONNECT_DOMAIN",
    "PROCONNECT_ISSUER",
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing ProConnect configuration: ${missing.join(", ")}`);
  }
};
```

### 3. Gestion des erreurs avec types

```typescript
// Types d'erreurs spécifiques à ProConnect
type ProConnectError =
  | "INVALID_JWT_USERINFO"
  | "MISSING_CLAIMS"
  | "NOT_PUBLIC_AGENT"
  | "ACCOUNT_LINKING_FAILED"
  | "CONFIG_VALIDATION_FAILED";

const handleProConnectError = (error: ProConnectError, context: any) => {
  logAuthEvent(`ProConnect error: ${error}`, context, "error");
  // Redirection appropriée selon le type d'erreur
};
```

## Sécurité

### Mesures de sécurité

1. **HTTPS obligatoire** en production
2. **Validation des tokens ProConnect** avec vérification de signature
3. **Sessions sécurisées** avec expiration automatique et renouvellement
4. **Protection CSRF** via NextAuth.js
5. **Validation des données** côté serveur avec types TypeScript
6. **Logging structuré** des tentatives d'accès pour audit
7. **Décodage sécurisé des JWT** sans vérification de signature (confiance HTTPS)
8. **Validation de configuration** au démarrage pour éviter les erreurs runtime

### Considérations spécifiques ProConnect

- **JWT userinfo non vérifié** : Acceptable car récupéré via HTTPS depuis ProConnect
- **Liaison automatique des comptes** : Sécurisée car ProConnect vérifie l'identité
- **Claims manquants** : Gestion gracieuse avec logging pour debugging
- **isPublicAgent temporaire** : Tous les utilisateurs ProConnect considérés comme agents publics

### Conformité RGPD

- Consentement explicite pour le stockage des données
- Possibilité de suppression des données utilisateur
- Chiffrement des données sensibles en base
- **Logging minimal** : Pas de stockage d'informations sensibles dans les logs
