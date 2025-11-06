# 🚀 Quick Start Guide

## Prerequisites Checklist

- [ ] Node.js 22 LTS installed
- [ ] Docker & Docker Compose installed
- [ ] Shopify Partner account
- [ ] Trello account with API access
- [ ] Domain with SSL capability

## 5-Minute Setup

### 1. Clone & Install (1 min)
```bash
git clone <repo>
cd shopytrello
npm install
```

### 2. Configure Environment (2 min)
```bash
cp .env.example .env
```

Edit `.env` and fill in:
```env
# Get from Shopify Partner Dashboard
SHOPIFY_API_KEY=your_key
SHOPIFY_API_SECRET=your_secret
SHOPIFY_APP_URL=https://your-domain.com

# Get from https://trello.com/power-ups/admin
TRELLO_API_KEY=your_trello_key
TRELLO_API_SECRET=your_trello_secret

# Generate: openssl rand -hex 32
SHOPIFY_ENCRYPTION_KEY=<generated_key>

# Your email for Let's Encrypt
CADDY_ACME_EMAIL=you@example.com
CADDY_DOMAIN=your-domain.com
```

### 3. Update Shopify Config (30 sec)
Edit `shopify.app.toml`:
```toml
client_id = "your_shopify_api_key"
application_url = "https://your-domain.com"
```

### 4. Deploy (1 min)
```bash
docker-compose up -d --build
```

### 5. Initialize Database (30 sec)
```bash
docker-compose exec web npm run prisma:migrate
```

## ✅ Verify Installation

1. **Health Check**: https://your-domain.com/api/health
2. **Install App**: Go to Shopify Partner Dashboard → Your App → Test on Store
3. **Connect Trello**: Navigate to `/app/integrations/trello` in the app

## Common Commands

```bash
# View logs
docker-compose logs -f web

# Restart services
docker-compose restart

# Run migrations
docker-compose exec web npm run prisma:migrate

# Access database
docker-compose exec db psql -U postgres shopytrello

# Run tests
npm test

# Type check
npm run typecheck
```

## Troubleshooting

### App won't load
```bash
# Check logs
docker-compose logs web

# Verify environment
docker-compose exec web env | grep SHOPIFY
```

### SSL issues
```bash
# Check Caddy logs
docker-compose logs caddy

# Verify DNS
dig your-domain.com
```

### Database errors
```bash
# Restart database
docker-compose restart db

# Check connection
docker-compose exec db psql -U postgres -c "SELECT 1;"
```

## Next Steps

1. ✅ Configure Shopify webhooks in Partner Dashboard
2. ✅ Set up Trello webhooks (automatic when connecting boards)
3. ✅ Create your first mapping in `/app/mappings`
4. ✅ Test with a sample order/product creation

## Support

- 📖 Full docs: [README.md](./README.md)
- 🔧 API reference: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- 🚢 Deployment: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 🧪 Testing: [TESTING.md](./TESTING.md)

## Architecture Overview

```
Browser → Caddy (HTTPS) → Next.js App → PostgreSQL
                            ↓
                    ┌───────┴────────┐
                    ↓                ↓
              Shopify API      Trello API
```

## File Structure

```
src/
├── app/              # Next.js pages & API routes
│   ├── api/         # Backend endpoints
│   └── app/         # Frontend pages
├── lib/             # Core utilities & clients
├── ui/              # Reusable components
│   ├── components/  # Base components
│   └── vuexy/       # Theme components
└── types/           # TypeScript definitions
```

## Development Workflow

1. Make changes
2. Test locally: `npm run dev`
3. Type check: `npm run typecheck`
4. Run tests: `npm test`
5. Build: `docker-compose up --build`
6. Deploy: Push to production

---

**Ready to build?** Start with connecting Trello and creating your first mapping! 🎉

