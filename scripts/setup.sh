#!/bin/bash

# Setup script for ShopiTrello
# This script helps set up the project for first-time use

set -e

echo "🚀 ShopiTrello Setup"
echo "===================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file from .env.example..."
  cp .env.example .env
  echo "✅ Created .env file"
  echo "⚠️  Please edit .env and fill in all required values!"
  echo ""
else
  echo "✅ .env file already exists"
  echo ""
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo "✅ Dependencies installed"
  echo ""
else
  echo "✅ Dependencies already installed"
  echo ""
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run prisma:generate
echo "✅ Prisma client generated"
echo ""

# Check Docker
if command -v docker &> /dev/null; then
  echo "✅ Docker is installed"
else
  echo "❌ Docker is not installed"
  echo "Please install Docker: https://docs.docker.com/get-docker/"
  exit 1
fi

if command -v docker-compose &> /dev/null; then
  echo "✅ Docker Compose is installed"
else
  echo "❌ Docker Compose is not installed"
  echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
  exit 1
fi

echo ""
echo "===================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and fill in all required values"
echo "2. Update shopify.app.toml with your app credentials"
echo "3. Run: docker-compose up -d --build"
echo "4. Run migrations: docker-compose exec web npm run prisma:migrate"
echo ""
echo "For more info, see README.md"
echo ""

