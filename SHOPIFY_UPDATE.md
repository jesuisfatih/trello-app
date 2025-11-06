# Shopify App Configuration - Updated for 2026-01

## ✅ Güncellemeler

### 1. API Versiyonu
- **Eski**: 2025-10
- **Yeni**: 2026-01

### 2. Scopes (İzinler)
Yeni kapsamlı scopes eklendi:
- `read_products, write_products` - Ürün okuma/yazma
- `read_orders, write_orders` - Sipariş okuma/yazma
- `read_customers, write_customers` - Müşteri okuma/yazma
- `read_inventory, write_inventory` - Stok okuma/yazma
- `read_content, write_content` - İçerik okuma/yazma

### 3. Domain Güncellemesi
- **Eski**: `trello-engine.dev`
- **Yeni**: `trello-engine.dev`

## 📋 Shopify Partner Dashboard'da Yapılacaklar

### 1. App Settings
1. [Shopify Partner Dashboard](https://partners.shopify.com) → Your App → App Setup
2. **App URL**: `https://trello-engine.dev`
3. **Allowed redirection URL(s)**:
   - `https://trello-engine.dev/api/shopify/auth/callback`
   - `https://trello-engine.dev/auth/callback`
   - `https://trello-engine.dev/api/auth/callback`

### 2. API Access Scopes
Aşağıdaki scopes'ları ekleyin:
```
read_products
write_products
read_orders
write_orders
read_customers
write_customers
read_inventory
write_inventory
read_content
write_content
```

### 3. Webhooks
Webhook API Version: **2026-01**

## 🔧 Environment Variables

`.env` dosyanıza ekleyin:

```env
# Shopify Configuration
SHOPIFY_API_KEY=cdbe8c337ddeddaa887cffff22dca575
SHOPIFY_API_SECRET=your_secret_here
SHOPIFY_APP_URL=https://trello-engine.dev
SHOPIFY_API_VERSION=2026-01
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_inventory,write_inventory,read_content,write_content

# Trello/Atlassian OAuth 2.0
TRELLO_CLIENT_ID=rm9VQFB7yNwtNgLjpc1vdi7lJ2gs0YLX
TRELLO_CLIENT_SECRET=ATOAfg1RK5BKL-dgBXpb9zsXRqRVQRB2nnzzwcObh2nNIVo3ZslLhiTGzYJdrVJCqBQM1E8B62A8
```

## 🚀 Deploy

```bash
# 1. Migration çalıştır (refreshToken için)
npm run prisma:migrate:dev

# 2. Commit ve push
git add -A
git commit -m "Update Shopify API to 2026-01 with comprehensive scopes"
git push origin main

# 3. Sunucuda pull ve rebuild
ssh root@46.224.63.208 'cd /opt/shopytrello && git pull origin main && docker compose up -d --build'
```

## ✅ Test

1. **Health Check**: `https://trello-engine.dev/api/health`
2. **Install App**: Shopify Partner Dashboard → Test on development store
3. **Verify Scopes**: App içinde `/app/settings` sayfasında scopes'ları kontrol edin

## 📝 Notlar

- OAuth 2.0 flow zaten implement edilmiş durumda
- Callback URL'ler otomatik olarak yapılandırılmış
- Webhook'lar 2026-01 API versiyonunu kullanıyor
- Tüm scopes read/write çiftleri halinde eklendi

