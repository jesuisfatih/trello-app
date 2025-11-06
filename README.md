# ShopiTrello

Shopify embedded app for seamless Trello integration. Connect your Shopify store with Trello to manage boards, lists, cards, and comments directly from your admin panel.

## Architecture

```
┌─────────────────┐
│   Shopify Store │
│   (Merchant)    │
└────────┬────────┘
         │ App Bridge
         │ Session Tokens
         ▼
┌─────────────────────────────────┐
│        Caddy (HTTPS/TLS)        │
│   Port 80/443 → Reverse Proxy   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│    Next.js 16 App (Node 22)     │
│  • GraphQL Admin API (2025-10)  │
│  • Token Exchange (JWT)         │
│  • Prisma ORM                   │
│  • Trello OAuth 1.0a            │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│    PostgreSQL 16 Database       │
│  • Shop data                    │
│  • Trello connections           │
│  • Event logs                   │
└─────────────────────────────────┘

         │
         ├─────────────────────────┐
         ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│  Shopify Admin   │    │   Trello API     │
│  GraphQL API     │    │   REST v1        │
│  (2025-10)       │    │   (OAuth 1.0a)   │
└──────────────────┘    └──────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 16 + React 19 + App Bridge 4.x
- **Backend**: Next.js API Routes (Node 22)
- **Database**: PostgreSQL 16 + Prisma 6.19
- **Reverse Proxy**: Caddy 2 (Auto TLS/SSL via ACME)
- **Deployment**: Docker Compose (Production)
- **Shopify**: GraphQL Admin API 2025-10, Session Tokens, Token Exchange
- **Trello**: OAuth 1.0a, REST API v1, Webhooks

## Prerequisites

- Node.js >= 20.9 (recommended: 22 LTS)
- Docker & Docker Compose
- Shopify Partner account with app created
- Trello API key and secret
- Domain with DNS pointing to your server

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd shopytrello
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in all required values in `.env`:

#### Shopify Configuration

1. Go to [Shopify Partner Dashboard](https://partners.shopify.com)
2. Create a new app or use existing one
3. Copy API key and secret:

```env
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_APP_URL=https://your-domain.com
```

4. Set OAuth callback URLs in Partner Dashboard:
   - `https://your-domain.com/api/auth/callback`
   - `https://your-domain.com/api/shopify/auth/callback`

#### Trello Configuration

1. Get your Trello API credentials:
   - Go to [https://trello.com/power-ups/admin](https://trello.com/power-ups/admin)
   - Create a new Power-Up or use existing
   - Copy API key and generate a secret

```env
TRELLO_API_KEY=your_trello_api_key
TRELLO_API_SECRET=your_trello_api_secret
TRELLO_OAUTH_CALLBACK_URL=https://your-domain.com/api/trello/oauth/callback
```

#### Database Configuration

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/shopytrello?schema=public
```

#### Caddy Configuration

```env
CADDY_ACME_EMAIL=your-email@example.com
CADDY_DOMAIN=your-domain.com
```

Generate a 32-byte encryption key:

```bash
openssl rand -hex 32
```

```env
SHOPIFY_ENCRYPTION_KEY=generated_key_here
```

### 3. Update shopify.app.toml

Edit `shopify.app.toml` and set:

```toml
client_id = "your_shopify_api_key"
application_url = "https://your-domain.com"
```

Update redirect URLs to match your domain.

### 4. Database Setup

Run Prisma migrations:

```bash
npm run prisma:migrate
```

Generate Prisma client:

```bash
npm run prisma:generate
```

### 5. Build and Deploy

Build and start all services:

```bash
docker-compose up -d --build
```

This will:
- Build the Next.js app in production mode
- Start PostgreSQL database
- Start Caddy reverse proxy with automatic HTTPS
- Run database migrations

### 6. Verify Deployment

Check service health:

```bash
docker-compose ps
docker-compose logs -f web
```

Visit `https://your-domain.com/api/health` to verify the app is running.

### 7. Install App on Shopify Store

1. Go to your Shopify Partner Dashboard
2. Navigate to your app
3. Click "Test on development store" or generate installation link
4. Install the app on a store
5. App will open in an iframe with App Bridge initialized

### 8. Connect Trello

1. Inside the app, navigate to Integrations → Trello
2. Click "Connect Trello Account"
3. Authorize the app on Trello
4. You'll be redirected back to the app

## Development

For local development (not production), you can run:

```bash
npm run dev
```

**Note**: This project is configured for production deployment only. Local dev requires additional setup for HTTPS and tunneling (e.g., ngrok, Cloudflare Tunnel).

## Webhook Configuration

### Shopify Webhooks

Webhooks are automatically configured via `shopify.app.toml`:

- `app/uninstalled` → Cleanup on app uninstall
- `customers/data_request` → GDPR data request
- `customers/redact` → GDPR customer deletion
- `shop/redact` → GDPR shop deletion

All webhooks verify HMAC signatures using `SHOPIFY_API_SECRET`.

### Trello Webhooks

Trello webhooks are created programmatically when you:

1. Connect a Trello account
2. Select a board to watch
3. Create webhook via API (app handles HEAD verification)

**Important**: Trello requires your webhook endpoint to:
- Respond to HEAD requests with 200 OK
- Use valid HTTPS certificate
- Respond within 5 seconds

## API Endpoints

### Shopify

- `POST /api/shopify/token` - Exchange session token for access token
- `POST /api/shopify/webhooks/[topic]` - Receive Shopify webhooks

### Trello OAuth

- `GET /api/trello/oauth/start` - Initiate OAuth flow
- `GET /api/trello/oauth/callback` - OAuth callback handler

### Trello API

- `GET /api/trello/boards` - List boards
- `POST /api/trello/boards` - Create board
- `GET /api/trello/lists?boardId=xxx` - List board lists
- `POST /api/trello/cards` - Create card
- `GET /api/trello/cards/[id]` - Get card details
- `POST /api/trello/cards/[id]/comments` - Add comment
- `PUT /api/trello/cards/[id]/comments/[commentId]` - Update comment
- `DELETE /api/trello/cards/[id]/comments/[commentId]` - Delete comment
- `PUT /api/trello/webhooks` - Create webhook
- `POST /api/trello/webhooks` - Receive webhook events

## Rate Limiting

Trello API rate limits:

- 300 requests per 10 seconds per API key
- 100 requests per 10 seconds per token

The app implements:
- Rate limit tracking
- Exponential backoff on 429 responses
- Automatic retry with delay

## Security

- **Session Tokens**: HS256 JWT validated on each request
- **Token Exchange**: Short-lived access tokens (1 min for online tokens)
- **HMAC Verification**: All Shopify webhooks verified
- **HTTPS Only**: Caddy enforces TLS 1.2+
- **HSTS**: Strict-Transport-Security headers
- **CSP**: Content Security Policy headers
- **Rate Limiting**: Protection against API abuse

## Database Schema

- **Shop**: Store installation data
- **User**: Merchant users (from session tokens)
- **TrelloConnection**: OAuth tokens and member IDs
- **TrelloWebhook**: Active webhook registrations
- **EventLog**: Audit trail for all events
- **Settings**: Shop-specific configuration

## Troubleshooting

### App doesn't load in Shopify admin

1. Check that `SHOPIFY_APP_URL` matches your domain exactly
2. Verify OAuth callback URLs in Partner Dashboard
3. Check browser console for App Bridge errors
4. Verify domain has valid SSL certificate

### Trello OAuth fails

1. Verify `TRELLO_API_KEY` and `TRELLO_API_SECRET`
2. Check callback URL matches exactly (including protocol)
3. Ensure your domain is accessible from Trello's servers

### Webhooks not receiving events

**Shopify**:
- Verify HMAC secret matches `SHOPIFY_API_SECRET`
- Check endpoint is publicly accessible
- Review webhook logs in Partner Dashboard

**Trello**:
- Ensure HEAD requests return 200 OK
- Verify HTTPS certificate is valid (not self-signed)
- Check webhook is active in database

### Database connection errors

```bash
docker-compose logs db
docker-compose restart db
```

### Rate limit errors

- Wait for the rate limit window to reset (10 seconds)
- Check for API call loops in your code
- Implement caching for frequently accessed data

## Scripts

- `npm run dev` - Development mode (requires additional setup)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run typecheck` - Type check TypeScript
- `npm run lint` - Lint code

## Monitoring

View logs:

```bash
docker-compose logs -f web     # App logs
docker-compose logs -f db      # Database logs
docker-compose logs -f caddy   # Caddy logs
```

Access logs are stored in Caddy data volume.

## Maintenance

### Backup Database

```bash
docker-compose exec db pg_dump -U postgres shopytrello > backup.sql
```

### Restore Database

```bash
cat backup.sql | docker-compose exec -T db psql -U postgres shopytrello
```

### Update App

```bash
git pull
docker-compose down
docker-compose up -d --build
```

## License

Proprietary - All rights reserved

## Support

For issues and questions, contact support or open an issue in the repository.
