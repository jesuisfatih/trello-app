# 🚀 SHOPIFY PARTNER DASHBOARD MANUEL GÜNCELLEME

## ✅ Sunucuda Hazır - Şimdi Partner Dashboard'ı Güncelleyin

### Adım 1: Partner Dashboard'a Gidin
https://partners.shopify.com → Apps → "Trello Engine"

### Adım 2: Configuration Sekmesi

#### **App URL**
```
https://trello-engine.dev
```

#### **Allowed redirection URL(s)**
```
https://trello-engine.dev/api/shopify/auth/callback
https://trello-engine.dev/auth/callback  
https://trello-engine.dev/api/auth/callback
```

#### **Embed app in Shopify admin**
```
✅ TRUE
```

### Adım 3: API Access (Scopes)

Configuration → API access → Configure → Scopes:

```
✅ read_products
✅ write_products
✅ read_orders
✅ write_orders
✅ read_customers
✅ write_customers
✅ read_inventory
✅ write_inventory
✅ read_content
✅ write_content
```

### Adım 4: Webhooks

Configuration → Webhooks → API version:
```
2026-01
```

Webhook subscriptions (otomatik eklenir):
- `app/uninstalled` → `/api/shopify/webhooks/app/uninstalled`
- `customers/data_request` → `/api/shopify/webhooks/customers/data_request`
- `customers/redact` → `/api/shopify/webhooks/customers/redact`
- `shop/redact` → `/api/shopify/webhooks/shop/redact`

### Adım 5: Save and Release

**"Save and release"** butonuna tıklayın.

### Adım 6: Uygulamayı Yeniden Yükleyin

#### A) Uninstall
Test mağazanızda:
1. Settings → Apps and sales channels
2. "Trello Engine" bulun
3. **Uninstall** (Kaldır)

#### B) Install
Partner Dashboard'a dönün:
1. Apps → "Trello Engine"
2. **"Select store"** veya **"Test on development store"**
3. Mağazayı seçin (`tester-12345678908798`)
4. **Install app**

### Adım 7: Kontrol

Uygulama açıldıktan sonra Browser Console (F12):
```javascript
console.log('Host:', new URLSearchParams(window.location.search).get('host'))
// BEKLENEN: YWRtaW4uc2hvcGlmeS5jb20vc3RvcmUv... (base64 string)
// ❌ OLMAMALI: null
```

---

## ⚙️ OPSIYONEL: Shopify CLI ile Otomatik Deploy

Eğer Shopify CLI kullanmak isterseniz:

### Local'de (Windows)
```powershell
cd C:\Users\mhmmd\Desktop\trello-app
shopify auth login      # Kendi hesabınızla login
shopify app deploy      # .toml dosyasını Partner Dashboard'a gönderir
```

**NOT:** `use_legacy_install_flow = false` doğru - yeni OAuth akışı kullanıyoruz.

---

## 📋 Özet

✅ Sunucuda tüm dosyalar `.dev` domain kullanıyor
✅ `.com` referansları temizlendi
✅ `shopify.app.toml` hazır
✅ Scopes: tam set (10 scope)
✅ API version: 2026-01

Şimdi **Partner Dashboard'da manuel olarak yukarıdaki ayarları yapın** veya **local'den `shopify app deploy` çalıştırın**.

