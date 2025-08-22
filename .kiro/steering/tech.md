# Technology Stack

## Frontend Framework

- **Next.js 15.5.0** with Pages Router (not App Router)
- **React 19.1.0** and React DOM 19.1.0
- **TypeScript 5** for static typing

## UI Framework & Styling

- **@codegouvfr/react-dsfr 1.26.0** - French State Design System components
- **Emotion** (@emotion/react, @emotion/server, @emotion/styled) for CSS-in-JS
- **tss-react 4.9.19** for TypeScript-safe styling
- **@mui/material 7.3.1** for additional components

## Authentication & Security

- **NextAuth.js 4.24.11** for authentication management
- **@next-auth/prisma-adapter** for database integration
- **jose 6.0.13** for JWT token verification
- **ProConnect** as OAuth2/OpenID Connect provider

## Database & ORM

- **Prisma 6.14.0** as ORM
- **PostgreSQL** as database (via Docker)
- **@prisma/client** for database operations

## Development Tools

- **ESLint 9** with Next.js configuration
- **Docker Compose** for local PostgreSQL

## Common Commands

### Development

```bash
npm run dev          # Start development server (includes DSFR icon update)
npm run build        # Build for production (includes DSFR icon update)
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Operations

```bash
npx prisma generate     # Generate Prisma client
npx prisma migrate dev  # Create and apply migration
npx prisma migrate deploy # Apply migrations (production)
npx prisma studio      # Open database GUI
npx prisma db push     # Sync schema without migration
```

### Docker

```bash
docker-compose up -d    # Start PostgreSQL
docker-compose ps       # Check container status
docker-compose logs postgres # View PostgreSQL logs
```

## Build Configuration

- **Webpack**: Custom configuration for .woff2 fonts
- **Transpilation**: @codegouvfr/react-dsfr and tss-react packages
- **React Strict Mode**: Enabled
- **SWC Minification**: Enabled
