#!/bin/bash

# Shopify App Config Push Script
# Bu script shopify.app.toml dosyasını Partner Dashboard'a gönderir

set -e

echo "🚀 Shopify App Configuration Push"
echo "===================================="
echo ""

cd /opt/shopytrello

# Node ve npm PATH'e ekle
export PATH="$HOME/.local/bin:$HOME/.local/opt/node/bin:$PATH"

echo "📋 Mevcut yapılandırma:"
echo "App URL: https://trello-engine.dev"
echo "Client ID: cdbe8c337ddeddaa887cffff22dca575"
echo "Scopes: read/write (10 scope)"
echo "API Version: 2026-01"
echo ""

echo "⚠️  NOT: Shopify CLI ile config push için auth gerekiyor."
echo "Lütfen LOCAL bilgisayarınızdan şu komutu çalıştırın:"
echo ""
echo "  cd C:\\Users\\mhmmd\\Desktop\\trello-app"
echo "  shopify auth login"
echo "  shopify app deploy --force"
echo ""
echo "VEYA Partner Dashboard'dan manuel güncelleyin:"
echo "  https://partners.shopify.com"
echo "  → Apps → Trello Engine → Configuration"
echo ""

