# Project Structure

## Root Directory

- **Configuration**: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`
- **Environment**: `.env`, `.env.example`, `.env.local` for configuration
- **Docker**: `docker-compose.yml` for PostgreSQL setup
- **Database**: `prisma/` directory with schema and migrations

## Source Code Organization (`src/`)

### Pages (`src/pages/`)

Uses Next.js Pages Router structure:

- `_app.tsx` - App wrapper with DSFR, Emotion, SessionProvider, ErrorBoundary
- `_document.tsx` - Document configuration
- `index.tsx` - Homepage
- `admin.tsx` - Admin dashboard
- `admin/config-check.tsx` - Configuration validation page

### Authentication Pages (`src/pages/auth/`)

- `signin.tsx` - ProConnect login page
- `error.tsx` - Authentication error handling
- `access-denied.tsx` - Access denied for non-public agents

### API Routes (`src/pages/api/`)

- `auth/[...nextauth].ts` - NextAuth configuration with ProConnect
- `auth/secure-signout.ts` - Secure logout endpoint
- `auth/validate-session.ts` - Session validation
- `health/proconnect.ts` - ProConnect health check
- `hello.ts` - Basic API example

### Library Code (`src/lib/`)

- `auth.ts` - Authentication utilities and session management
- `proconnect.ts` - ProConnect integration and configuration
- `error-handling.ts` - Structured error logging
- `config-validation.ts` - Environment validation
- `useSessionManagement.ts` - Client-side session hooks
- `SessionTimeoutWarning.tsx` - Session timeout component
- `createEmotionCache.ts` - Emotion cache configuration
- `client-error-handling.ts` - Client-side error handling

### Components (`src/components/`)

- `ErrorBoundary.tsx` - React error boundary component

### Styling (`src/styles/`)

- `globals.css` - Global styles
- `Home.module.css` - Homepage-specific styles

### Types (`src/types/`)

- `next-auth.d.ts` - NextAuth type extensions

## Database (`prisma/`)

- `schema.prisma` - Database schema with User, Account, Session, VerificationToken models
- `migrations/` - Database migration files

## Key Patterns

### Authentication Flow

1. ProConnect OAuth2 redirect
2. JWT token verification with jose
3. User profile transformation and validation
4. Public agent status verification
5. Session creation with Prisma adapter

### Error Handling

- Structured logging with context
- Client and server-side error boundaries
- Authentication-specific error pages

### Security

- Public agent verification on all protected routes
- Session timeout warnings
- Secure cookie configuration
- HTTPS enforcement in production

### Styling Architecture

- DSFR components as primary UI library
- Emotion for CSS-in-JS
- tss-react for TypeScript-safe styling
- MUI Material for additional components
