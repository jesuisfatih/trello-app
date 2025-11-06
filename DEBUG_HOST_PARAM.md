## 🚀 SUNUCUYA GÖNDER

### shopify.app.toml Güncellemesi

✅ Sunucuda güncel versiyonu:

```toml
name = "ShopiTrello"
client_id = "cdbe8c337ddeddaa887cffff22dca575"
application_url = "https://trello-engine.dev"
embedded = true

[access_scopes]
scopes = "read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_inventory,write_inventory,read_content,write_content"
use_legacy_install_flow = false

[auth]
redirect_urls = [
  "https://trello-engine.dev/api/shopify/auth/callback",
  "https://trello-engine.dev/auth/callback",
  "https://trello-engine.dev/api/auth/callback"
]

[webhooks]
api_version = "2026-01"
```

### ✅ Kontrol

- ❌ `.com` domain YOK
- ✅ `.dev` domain VAR
- ✅ Scopes: read/write tam set
- ✅ API version: 2026-01
- ✅ Redirect URLs: doğru

### 📋 Partner Dashboard'da Yapılacaklar

**1. App Configuration:**
- App URL: `https://trello-engine.dev`
- Allowed redirection URL(s):
  - `https://trello-engine.dev/api/shopify/auth/callback`
  - `https://trello-engine.dev/auth/callback`
  - `https://trello-engine.dev/api/auth/callback`

**2. Access Scopes:**
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

**3. API Version:** 
- Webhook API version: `2026-01`

### ⚠️ ÖNEMLİ

Partner Dashboard'da değişiklik yaptıktan sonra:
1. **Save and release**
2. **Uygulamayı uninstall edin**
3. **Yeniden install edin**

Ancak bu adımlardan sonra `host` parametresi gelecek!

