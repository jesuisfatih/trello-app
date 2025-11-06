# Project Structure

```
shopytrello/
├── .github/
│   └── workflows/
│       └── ci.yml                      # GitHub Actions CI pipeline
├── docker/
│   └── .gitkeep                        # Docker-related files
├── prisma/
│   ├── migrations/                     # Database migrations
│   │   └── .gitkeep
│   └── schema.prisma                   # Prisma schema definition
├── scripts/
│   ├── setup.sh                        # Setup script for first-time installation
│   └── test-env.js                     # Environment variable validation
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── verify/
│   │   │   │       └── route.ts        # Session verification endpoint
│   │   │   ├── graphql/
│   │   │   │   └── route.ts            # GraphQL proxy endpoint
│   │   │   ├── health/
│   │   │   │   └── route.ts            # Health check endpoint
│   │   │   ├── shopify/
│   │   │   │   ├── token/
│   │   │   │   │   └── route.ts        # Token exchange endpoint
│   │   │   │   └── webhooks/
│   │   │   │       └── [...topic]/
│   │   │   │           └── route.ts    # Shopify webhook handler
│   │   │   └── trello/
│   │   │       ├── boards/
│   │   │       │   ├── route.ts        # List/create boards
│   │   │       │   └── [boardId]/
│   │   │       │       └── route.ts    # Get/update/delete board
│   │   │       ├── cards/
│   │   │       │   ├── route.ts        # List/create cards
│   │   │       │   └── [cardId]/
│   │   │       │       ├── route.ts    # Get/update/delete card
│   │   │       │       └── comments/
│   │   │       │           ├── route.ts        # Get/add comments
│   │   │       │           └── [commentId]/
│   │   │       │               └── route.ts    # Update/delete comment
│   │   │       ├── lists/
│   │   │       │   └── route.ts        # List/create lists
│   │   │       ├── oauth/
│   │   │       │   ├── callback/
│   │   │       │   │   └── route.ts    # OAuth callback handler
│   │   │       │   └── start/
│   │   │       │       └── route.ts    # OAuth initiation
│   │   │       └── webhooks/
│   │   │           └── route.ts        # Trello webhook handler
│   │   ├── app/
│   │   │   ├── boards/
│   │   │   │   ├── page.tsx            # Boards list page
│   │   │   │   └── [boardId]/
│   │   │   │       └── page.tsx        # Board detail page
│   │   │   ├── integrations/
│   │   │   │   └── trello/
│   │   │   │       └── page.tsx        # Trello integration page
│   │   │   ├── logs/
│   │   │   │   └── page.tsx            # Event logs page
│   │   │   ├── mappings/
│   │   │   │   └── page.tsx            # Mappings configuration page
│   │   │   ├── settings/
│   │   │   │   └── page.tsx            # Settings page
│   │   │   ├── layout.tsx              # App layout with App Bridge
│   │   │   └── page.tsx                # Dashboard page
│   │   ├── globals.css                 # Global styles
│   │   ├── layout.tsx                  # Root layout
│   │   └── page.tsx                    # Root page (redirects to /app)
│   ├── lib/
│   │   ├── app-bridge.ts               # App Bridge utilities
│   │   ├── cache.ts                    # In-memory cache implementation
│   │   ├── db.ts                       # Prisma client singleton
│   │   ├── errors.ts                   # Custom error classes
│   │   ├── graphql-queries.ts          # GraphQL query definitions
│   │   ├── logger.ts                   # Logging utility
│   │   ├── rate-limiter.ts             # Rate limiting implementation
│   │   ├── shopify.ts                  # Shopify API client
│   │   ├── trello.ts                   # Trello API client
│   │   └── validation.ts               # Zod validation schemas
│   ├── types/
│   │   └── index.ts                    # TypeScript type definitions
│   ├── ui/
│   │   └── components/
│   │       ├── DashboardLayout.tsx     # Main dashboard layout
│   │       └── index.ts                # Component exports
│   └── middleware.ts                   # Next.js middleware
├── .dockerignore                       # Docker ignore patterns
├── .env.example                        # Environment variables template
├── .eslintrc.json                      # ESLint configuration
├── .gitignore                          # Git ignore patterns
├── Caddyfile                           # Caddy reverse proxy config
├── CHANGELOG.md                        # Version history
├── CONTRIBUTING.md                     # Contribution guidelines
├── Dockerfile                          # Docker build configuration
├── LICENSE                             # MIT License
├── PROJECT_STRUCTURE.md                # This file
├── README.md                           # Main documentation
├── SECURITY.md                         # Security policy
├── docker-compose.yml                  # Docker Compose configuration
├── next.config.ts                      # Next.js configuration
├── package.json                        # NPM dependencies
├── postcss.config.js                   # PostCSS configuration
├── shopify.app.toml                    # Shopify app configuration
├── tailwind.config.ts                  # Tailwind CSS configuration
└── tsconfig.json                       # TypeScript configuration
```

## Key Directories

### `/src/app/api/`
All API routes following Next.js App Router conventions. Organized by service (Shopify, Trello).

### `/src/app/app/`
Client-side pages rendered within the Shopify admin iframe. Uses App Bridge for native integration.

### `/src/lib/`
Shared utilities, API clients, and helper functions. Core business logic resides here.

### `/src/ui/`
Reusable UI components. Can be extended with Vuexy theme components.

### `/prisma/`
Database schema and migrations managed by Prisma ORM.

### `/scripts/`
Utility scripts for setup, testing, and maintenance.

## Configuration Files

- **shopify.app.toml**: Shopify CLI configuration with webhooks and scopes
- **docker-compose.yml**: Multi-container orchestration (web, db, caddy)
- **Dockerfile**: Multi-stage Node.js build for production
- **Caddyfile**: Reverse proxy with automatic HTTPS
- **.env.example**: Environment variable template (never commit actual .env)

## Entry Points

- **Server**: `src/app/layout.tsx` → Root layout
- **API**: `src/app/api/**/route.ts` → Individual endpoints
- **Client**: `src/app/app/page.tsx` → Dashboard
- **Database**: `prisma/schema.prisma` → Schema definition

## Data Flow

1. **Client** → App Bridge → Session Token
2. **API Route** → Validate Token → Token Exchange
3. **Shopify/Trello API** → Fetch/Mutate Data
4. **Database** → Log Events → Return Response
5. **Client** → Render UI

## Build Output

- `.next/standalone/` - Standalone Node.js server
- `.next/static/` - Static assets
- `node_modules/.prisma/` - Generated Prisma client

## Docker Volumes

- `postgres_data` - PostgreSQL database files
- `caddy_data` - Caddy certificates and data
- `caddy_config` - Caddy configuration state

