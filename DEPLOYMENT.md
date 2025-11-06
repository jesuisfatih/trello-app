# Deployment Guide

## Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Docker and Docker Compose installed
- Domain name pointing to your server
- Ports 80 and 443 open
- At least 2GB RAM, 20GB disk

## Step-by-Step Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clone Repository

```bash
git clone <repository-url>
cd shopytrello
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

Required values:
```env
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_APP_URL=https://your-domain.com
TRELLO_API_KEY=your_trello_api_key
TRELLO_API_SECRET=your_trello_api_secret
CADDY_ACME_EMAIL=your-email@example.com
CADDY_DOMAIN=your-domain.com
SHOPIFY_ENCRYPTION_KEY=$(openssl rand -hex 32)
```

### 4. Configure Shopify App

Edit `shopify.app.toml`:

```toml
client_id = "your_shopify_api_key"
application_url = "https://your-domain.com"

[auth]
redirect_urls = [
  "https://your-domain.com/api/auth/callback",
  "https://your-domain.com/api/shopify/auth/callback"
]
```

In Shopify Partner Dashboard:
1. Go to your app settings
2. Set App URL: `https://your-domain.com`
3. Set Allowed redirection URL(s):
   - `https://your-domain.com/api/auth/callback`
   - `https://your-domain.com/api/shopify/auth/callback`

### 5. Build and Start

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 6. Run Database Migrations

```bash
docker-compose exec web npm run prisma:migrate
```

### 7. Verify Deployment

```bash
# Health check
curl https://your-domain.com/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

### 8. SSL Certificate

Caddy automatically obtains SSL certificates from Let's Encrypt.

Check certificate:
```bash
docker-compose logs caddy | grep -i acme
```

### 9. Install App on Shopify

1. Go to Shopify Partner Dashboard
2. Select your app
3. Click "Test on development store"
4. Install the app

## Post-Deployment

### Monitoring

View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f web
docker-compose logs -f db
docker-compose logs -f caddy
```

Check resource usage:
```bash
docker stats
```

### Backup Database

Create backup:
```bash
docker-compose exec db pg_dump -U postgres shopytrello > backup-$(date +%Y%m%d).sql
```

Restore backup:
```bash
cat backup-20241106.sql | docker-compose exec -T db psql -U postgres shopytrello
```

### Updates

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run migrations
docker-compose exec web npm run prisma:migrate
```

### Scaling

To handle more traffic, adjust resources in `docker-compose.yml`:

```yaml
services:
  web:
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '4'
          memory: 2G
```

Then restart:
```bash
docker-compose up -d --scale web=2
```

## Troubleshooting

### App doesn't load

1. Check logs: `docker-compose logs -f web`
2. Verify environment variables: `docker-compose exec web env | grep SHOPIFY`
3. Test health endpoint: `curl https://your-domain.com/api/health`

### SSL certificate errors

1. Verify DNS points to your server: `dig your-domain.com`
2. Check Caddy logs: `docker-compose logs caddy`
3. Ensure email is set: `CADDY_ACME_EMAIL` in `.env`

### Database connection errors

1. Check database is running: `docker-compose ps db`
2. Test connection: `docker-compose exec db psql -U postgres -d shopytrello -c "SELECT 1;"`
3. Restart database: `docker-compose restart db`

### Webhook failures

1. Verify webhook URLs in Partner Dashboard
2. Check webhook logs in database
3. Test webhook endpoint: `curl -X POST https://your-domain.com/api/shopify/webhooks/app/uninstalled`

### Rate limit errors

1. Check Trello API usage
2. Review rate limiter logs
3. Increase cache TTL if needed

## Security Checklist

- [ ] Strong database password set
- [ ] All environment variables properly configured
- [ ] Firewall configured (only 80/443 open)
- [ ] SSL certificate obtained and valid
- [ ] Database backups scheduled
- [ ] Logs monitored for errors
- [ ] Updates applied regularly
- [ ] GDPR webhooks functioning

## Production Optimizations

### 1. Use External Database

For production, use managed PostgreSQL (AWS RDS, DigitalOcean, etc.):

```env
DATABASE_URL=postgresql://user:pass@external-host:5432/shopytrello
```

Remove `db` service from `docker-compose.yml`.

### 2. Use Redis for Caching

Add Redis service:

```yaml
services:
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

Update cache implementation to use Redis.

### 3. Set Up Monitoring

Install monitoring stack:
- Prometheus for metrics
- Grafana for dashboards
- Loki for log aggregation

### 4. Enable CDN

Use Cloudflare or similar CDN:
1. Point domain to CDN
2. Configure SSL/TLS (Full mode)
3. Enable caching rules

### 5. Database Connection Pooling

Use PgBouncer for connection pooling:

```yaml
services:
  pgbouncer:
    image: pgbouncer/pgbouncer
    environment:
      DATABASES_HOST: db
```

## Maintenance

### Weekly Tasks

- Review error logs
- Check disk space
- Verify backups
- Update dependencies

### Monthly Tasks

- Security updates
- Performance review
- Database optimization
- Cost analysis

### Quarterly Tasks

- Disaster recovery test
- Security audit
- Dependency audit
- Documentation update

## Support

For deployment issues:
1. Check logs first
2. Review troubleshooting section
3. Open GitHub issue
4. Contact support

## Infrastructure as Code

For automated deployments, consider:
- Terraform for infrastructure
- Ansible for configuration
- GitHub Actions for CI/CD
- Kubernetes for orchestration (advanced)

