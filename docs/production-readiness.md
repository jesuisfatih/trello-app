# Production Configuration & Deployment Checklist

## Environment Variables

Set the following variables in your production hosting provider (do not commit secrets):

- `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET`
- `SHOPIFY_APP_URL` (e.g. `https://trello-engine.dev`)
- `SHOPIFY_ENCRYPTION_KEY` (32-byte hex string)
- `SHOPIFY_SCOPES` (`read_products,write_products,read_orders,write_orders` etc. per Partner Dashboard)
- `TRELLO_API_KEY` / `TRELLO_API_SECRET`
- `TRELLO_OAUTH1_SCOPE` (`read,write,account`)
- `TRELLO_OAUTH1_EXPIRATION` (`never` recommended)
- `NEXT_PUBLIC_TRELLO_API_KEY` (safe to expose – same value as API key)
- `DATABASE_URL` (PostgreSQL connection string)
- `CADDY_ACME_EMAIL`, `CADDY_DOMAIN`
- `APP_NAME=SEO DROME TEAM`
- `APP_PLAN_NAME=SEO DROME TEAM Premium`
- `APP_PLAN_PRICE_USD=9.99`

## Trello OAuth 1.0a Configuration

1. Open <https://trello.com/power-ups/admin>, select your Power-Up.
2. Ensure the following settings match production domain:
   - **Allowed Origins**: `https://trello-engine.dev`
   - **OAuth callback URL**: `https://trello-engine.dev/api/trello/oauth1/callback`
3. Copy API Key and Secret into environment variables above.
4. Under **Authorization**, enable `read`, `write`, and `account` scopes.
5. Test the OAuth start endpoint locally before deploying (`/api/trello/oauth1/start`).

## Shopify Partner Dashboard

1. App setup → URLs
   - `App URL`: `https://trello-engine.dev/app`
   - `Allowed redirection URL(s)`: 
     - `https://trello-engine.dev/api/shopify/auth/callback`
     - `https://trello-engine.dev/api/auth/callback`
     - `https://trello-engine.dev/api/trello/oauth1/callback`
2. Billing → create one usage plan: **SEO DROME TEAM Premium** at **$9.99 USD / month**.
3. App embeds → enable **Admin** embed with `https://trello-engine.dev/app`.
4. Webhooks (GDPR): ensure default topics point to `/api/shopify/webhooks/...`.

## Deployment Steps (Docker Compose)

```bash
git pull origin main
docker compose down
docker compose up -d --build
```

The `web` service build step runs:

1. `npx prisma generate`
2. `npm run build`
3. Copies `.next/standalone` into runtime image

Post deployment:

- Run `docker compose ps` to ensure `web`, `db`, and `caddy` are healthy
- Visit `https://trello-engine.dev/api/health`
- Inspect `docker compose logs -f web` for Prisma migration output

## Database Migration

When schema changes are introduced:

```bash
npm run prisma:migrate
git add prisma/migrations
git commit -m "Add <description>"
```

On the server the build step runs `prisma generate`; if new migrations exist ensure you run:

```bash
docker compose run --rm web npx prisma migrate deploy
```

## Verification Before Submit

- [ ] Install app on development store via fresh OAuth
- [ ] Run Trello manual token connection (still functional)
- [ ] Complete Trello OAuth 1.0a connection and open a board
- [ ] Drag cards between lists and reorder lists – verify Trello updates
- [ ] Create/delete Trello card from Shopify UI – verify result in Trello
- [ ] Confirm App Bridge host/shop cookies present on each page load
- [ ] Confirm GDPR endpoints respond `200`
- [ ] Verify support email reachable (`support@seodrometeam.com`)
- [ ] Capture screenshots for Shopify listing after final build

Keep this checklist updated as production responsibilities evolve.

