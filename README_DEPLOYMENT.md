# 🚀 Deployment Guide for trello-engine.dev

## 📋 Prerequisites

- [x] Ubuntu server at 46.224.63.208
- [x] Domain: trello-engine.dev
- [x] Shopify Partner credentials configured
- [ ] Trello API credentials (will be added after deployment)

## 🎯 Quick Deployment

### Step 1: Push to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ShopiTrello production ready"

# Add remote (replace with your repo)
git remote add origin https://github.com/YOUR_USERNAME/shopytrello.git

# Push
git push -u origin main
```

### Step 2: Deploy to Server

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

This will automatically:
- ✅ Install Docker & Docker Compose
- ✅ Install Node.js 22
- ✅ Copy all files to server
- ✅ Build Docker containers
- ✅ Start the application
- ✅ Configure firewall
- ✅ Set up SSL with Caddy

### Step 3: Add Trello API Keys

After deployment, add your Trello credentials:

```bash
# Make script executable
chmod +x setup-trello.sh

# Run Trello setup
./setup-trello.sh
```

Or manually via SSH:

```bash
# Connect to server
ssh root@46.224.63.208

# Edit .env file
cd /opt/shopytrello
nano .env

# Update these lines:
TRELLO_API_KEY=your_trello_api_key
TRELLO_API_SECRET=your_trello_api_secret

# Save (Ctrl+X, Y, Enter)

# Restart containers
docker-compose restart
```

## 🔍 Verification

### Check Services

```bash
ssh root@46.224.63.208
cd /opt/shopytrello

# Check container status
docker-compose ps

# View logs
docker-compose logs -f web
docker-compose logs -f caddy

# Test health endpoint
curl https://trello-engine.dev/api/health
```

### Expected Response

```json
{
  "status": "ok",
  "timestamp": "2024-11-06T..."
}
```

## 📱 Test the App

1. **Open Shopify Partner Dashboard**
2. **Go to your app**
3. **Click "Test on development store"**
4. **Install the app**
5. **Navigate to app in Shopify admin**

## 🔗 Important URLs

| Purpose | URL |
|---------|-----|
| App Home | https://trello-engine.dev |
| Health Check | https://trello-engine.dev/api/health |
| Install Page | https://trello-engine.dev/api/shopify/install |
| Trello Integration | https://trello-engine.dev/app/integrations/trello |

## 📊 Monitoring

```bash
# View all logs
ssh root@46.224.63.208 'cd /opt/shopytrello && docker-compose logs -f'

# View specific service logs
ssh root@46.224.63.208 'cd /opt/shopytrello && docker-compose logs -f web'
ssh root@46.224.63.208 'cd /opt/shopytrello && docker-compose logs -f db'
ssh root@46.224.63.208 'cd /opt/shopytrello && docker-compose logs -f caddy'

# Check disk usage
ssh root@46.224.63.208 'df -h'

# Check memory
ssh root@46.224.63.208 'free -h'
```

## 🛠️ Maintenance

### Update Application

```bash
# On your local machine
git pull  # Get latest changes
./deploy.sh  # Deploy updates
```

### Restart Services

```bash
ssh root@46.224.63.208
cd /opt/shopytrello
docker-compose restart
```

### View Database

```bash
ssh root@46.224.63.208
cd /opt/shopytrello
docker-compose exec db psql -U postgres shopytrello
```

### Backup Database

```bash
ssh root@46.224.63.208
cd /opt/shopytrello
docker-compose exec db pg_dump -U postgres shopytrello > backup_$(date +%Y%m%d).sql
```

## 🐛 Troubleshooting

### SSL Certificate Issues

```bash
# Check Caddy logs
ssh root@46.224.63.208 'cd /opt/shopytrello && docker-compose logs caddy | grep -i acme'

# Restart Caddy
ssh root@46.224.63.208 'cd /opt/shopytrello && docker-compose restart caddy'
```

### App Not Loading

```bash
# Check if containers are running
ssh root@46.224.63.208 'cd /opt/shopytrello && docker-compose ps'

# Restart all services
ssh root@46.224.63.208 'cd /opt/shopytrello && docker-compose restart'
```

### Database Connection Errors

```bash
# Check database
ssh root@46.224.63.208 'cd /opt/shopytrello && docker-compose exec db psql -U postgres -c "SELECT 1;"'

# Restart database
ssh root@46.224.63.208 'cd /opt/shopytrello && docker-compose restart db'
```

## 🔐 Security Notes

1. **SSH Key Authentication** (Recommended)
   ```bash
   ssh-copy-id root@46.224.63.208
   ```

2. **Change Database Password**
   Edit `.env` on server and update `DATABASE_URL`

3. **Firewall is configured** to allow only:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS)

## 📞 Support

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify environment: `cat .env | grep -v SECRET`
3. Test endpoints: `curl https://trello-engine.dev/api/health`

## ✅ Post-Deployment Checklist

- [ ] Health endpoint returns 200
- [ ] SSL certificate is active (https works)
- [ ] Shopify app installs successfully
- [ ] Trello OAuth works
- [ ] Can create cards in Trello
- [ ] Webhooks are receiving events
- [ ] Mappings are functioning

---

**Your app is live at: https://trello-engine.dev** 🎉

