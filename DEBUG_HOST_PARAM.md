## 🔍 Shopify Admin Host Parametresi Tespiti

Lütfen şunu yapın:

1. **Shopify Admin'den uygulamayı açın**
2. **Browser Console'u açın** (F12 veya Sağ tık → Inspect → Console)
3. **Aşağıdaki komutu yapıştırıp çalıştırın:**

```javascript
console.log('===== SHOPIFY DEBUG =====');
console.log('Full URL:', window.location.href);
console.log('Search params:', window.location.search);
console.log('Host param:', new URLSearchParams(window.location.search).get('host'));
console.log('Shop param:', new URLSearchParams(window.location.search).get('shop'));
console.log('window.shopify:', window.shopify);
console.log('========================');
```

4. **Çıktıyı bana gönderin**

### Muhtemel Sorunlar

1. **App URL yanlış yapılandırılmış olabilir**
   - Partner Dashboard → App → Configuration
   - App URL: `https://trello-engine.com` VEYA `https://trello-engine.dev` (hangisi?)

2. **Allowed redirection URLs eksik olabilir**

3. **Shopify Admin'den uygulama nasıl açılıyor?**
   - Apps → "Trello Engine" (veya app adınız)
   - URL nasıl görünüyor?

### Beklenen URL Formatı

Shopify Admin'den açılınca URL şöyle olmalı:
```
https://trello-engine.com/app?host=YWRtaW4uc2hvcGlmeS5jb20vc3RvcmUvdGVzdGVyLTEyMzQ1Njc4OTA4Nzk4
```

veya

```
https://trello-engine.com/app?shop=tester-12345678908798.myshopify.com&host=...
```

Console çıktısını gönderin, sorunu hemen çözerim.

