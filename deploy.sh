#!/bin/bash

# ShopiTrello Automated Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 Starting ShopiTrello Deployment"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="46.224.63.208"
SERVER_USER="root"
APP_DIR="/opt/shopytrello"
DOMAIN="trello-engine.dev"

echo ""
echo "📋 Deployment Configuration:"
echo "   Server: $SERVER_IP"
echo "   Domain: $DOMAIN"
echo "   Directory: $APP_DIR"
echo ""

# Step 1: Install Dependencies on Server
echo "📦 Step 1/6: Installing dependencies on server..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
    # Update system
    apt-get update
    apt-get upgrade -y

    # Install Docker
    if ! command -v docker &> /dev/null; then
        echo "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
    fi

    # Install Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi

    # Install Git
    if ! command -v git &> /dev/null; then
        echo "Installing Git..."
        apt-get install -y git
    fi

    # Install Node.js 22 (for local testing if needed)
    if ! command -v node &> /dev/null; then
        echo "Installing Node.js 22..."
        curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
        apt-get install -y nodejs
    fi

    echo "✅ All dependencies installed!"
ENDSSH

# Step 2: Create application directory
echo ""
echo "📁 Step 2/6: Creating application directory..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $APP_DIR"

# Step 3: Copy files to server
echo ""
echo "📤 Step 3/6: Copying files to server..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude 'build' \
    ./ $SERVER_USER@$SERVER_IP:$APP_DIR/

# Step 4: Setup environment
echo ""
echo "⚙️  Step 4/6: Setting up environment..."
ssh $SERVER_USER@$SERVER_IP << ENDSSH
    cd $APP_DIR
    
    # Copy production env
    cp .env.production .env
    
    # Set correct permissions
    chmod 600 .env
    
    # Show environment (without secrets)
    echo "Environment configured for: $DOMAIN"
ENDSSH

# Step 5: Build and start containers
echo ""
echo "🐳 Step 5/6: Building and starting Docker containers..."
ssh $SERVER_USER@$SERVER_IP << ENDSSH
    cd $APP_DIR
    
    # Stop existing containers
    docker-compose down 2>/dev/null || true
    
    # Build and start
    docker-compose up -d --build
    
    # Wait for services to be healthy
    echo "Waiting for services to start..."
    sleep 10
    
    # Run migrations
    echo "Running database migrations..."
    docker-compose exec -T web npm run prisma:migrate || true
    
    # Show status
    docker-compose ps
ENDSSH

# Step 6: Configure firewall
echo ""
echo "🔒 Step 6/6: Configuring firewall..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
    # Allow SSH, HTTP, HTTPS
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Enable firewall (if not already enabled)
    echo "y" | ufw enable 2>/dev/null || true
    
    ufw status
ENDSSH

# Final checks
echo ""
echo "✅ Deployment Complete!"
echo "======================"
echo ""
echo "🔗 URLs:"
echo "   App: https://$DOMAIN"
echo "   Health: https://$DOMAIN/api/health"
echo "   Install: https://$DOMAIN/api/shopify/install"
echo ""
echo "📋 Next Steps:"
echo "   1. Wait 2-3 minutes for SSL certificate"
echo "   2. Test health endpoint: curl https://$DOMAIN/api/health"
echo "   3. SSH to server: ssh $SERVER_USER@$SERVER_IP"
echo "   4. Add Trello API keys: nano /opt/shopytrello/.env"
echo "   5. Restart: docker-compose -f /opt/shopytrello/docker-compose.yml restart"
echo ""
echo "📊 View logs:"
echo "   ssh $SERVER_USER@$SERVER_IP 'cd $APP_DIR && docker-compose logs -f web'"
echo ""
echo "⚠️  IMPORTANT: Add Trello API keys to .env file on server!"
echo ""
ENDSSH

