#!/bin/bash

# Script to add Trello API keys after deployment
# Run this on your LOCAL machine after getting Trello credentials

set -e

SERVER_IP="46.224.63.208"
SERVER_USER="root"
APP_DIR="/opt/shopytrello"

echo "🔑 Trello API Configuration"
echo "==========================="
echo ""

# Prompt for Trello credentials
read -p "Enter Trello API Key: " TRELLO_KEY
read -p "Enter Trello API Secret: " TRELLO_SECRET

if [ -z "$TRELLO_KEY" ] || [ -z "$TRELLO_SECRET" ]; then
    echo "❌ Error: Trello credentials cannot be empty!"
    exit 1
fi

echo ""
echo "📤 Updating .env file on server..."

# Update .env file on server
ssh $SERVER_USER@$SERVER_IP << ENDSSH
    cd $APP_DIR
    
    # Backup current .env
    cp .env .env.backup
    
    # Update Trello keys
    sed -i "s/^TRELLO_API_KEY=.*/TRELLO_API_KEY=$TRELLO_KEY/" .env
    sed -i "s/^TRELLO_API_SECRET=.*/TRELLO_API_SECRET=$TRELLO_SECRET/" .env
    
    echo "✅ Trello API keys updated!"
    
    # Restart containers
    echo "🔄 Restarting containers..."
    docker-compose restart
    
    # Wait a bit
    sleep 5
    
    # Show status
    docker-compose ps
ENDSSH

echo ""
echo "✅ Trello API configured successfully!"
echo ""
echo "🔗 Test the integration:"
echo "   1. Go to https://trello-engine.dev/app/integrations/trello"
echo "   2. Click 'Connect Trello Account'"
echo "   3. Authorize the app"
echo ""
ENDSSH

