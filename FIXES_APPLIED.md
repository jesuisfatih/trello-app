## 🔧 Tüm Sorunlar Düzeltildi!

### ✅ Yapılan Düzeltmeler

1. **App Bridge Script Loading**
   - ❌ Eski: Next.js Script component async ekliyordu
   - ✅ Yeni: Root layout'ta direkt `<script>` tag (async/defer yok)
   - ✅ `suppressHydrationWarning` eklendi

2. **X-Frame-Options Header**
   - ❌ Eski: `ALLOW-FROM` (desteklenmiyor)
   - ✅ Yeni: `Content-Security-Policy: frame-ancestors https://*.myshopify.com`

3. **Trello Token Validation**
   - ✅ Token format validation eklendi (ATTA ile başlamalı)
   - ✅ API key kontrolü eklendi
   - ✅ Daha detaylı hata mesajları
   - ✅ Shop domain fallback mekanizması

4. **API Endpoint'leri**
   - ✅ `/api/trello/connect` GET: `Bearer null` durumunda 200 döner
   - ✅ `/api/trello/connect` POST: Shop domain fallback eklendi
   - ✅ Host parametresinden shop domain çıkarılıyor

### 🔍 Trello Token Sorunu İçin Kontrol Listesi

1. **Environment Variables Kontrol:**
   ```bash
   # Sunucuda kontrol et:
   ssh root@46.224.63.208 'cd /opt/shopytrello && cat .env | grep TRELLO'
   ```

2. **Trello API Key:**
   - API Key: `e2dc5f7dcce322a3945a62c228c31fa1` ✅
   - Bu key'in `.env` dosyasında `TRELLO_API_KEY` olarak ayarlanmış olması gerekiyor

3. **Trello Token:**
   - Token: `ATTAec6e0fe59442fa58221256889508486aa8317ebd5f5a960e2789cf499080268d0908E969`
   - Bu token, yukarıdaki API key ile oluşturulmuş olmalı

### 🚨 Eğer Hala "Invalid Token" Alıyorsanız

1. **Token'ı yeniden al:**
   - https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=ShopiTrello&key=e2dc5f7dcce322a3945a62c228c31fa1
   - Bu linkten yeni token al

2. **API Key'i kontrol et:**
   - Sunucuda `.env` dosyasında `TRELLO_API_KEY=e2dc5f7dcce322a3945a62c228c31fa1` olduğundan emin ol

3. **Container'ı restart et:**
   ```bash
   ssh root@46.224.63.208 'cd /opt/shopytrello && docker compose restart web'
   ```

### 📝 Sonraki Adımlar

1. Sayfayı yenileyin
2. Manuel token ile tekrar deneyin
3. Yeni token alın (yukarıdaki linkten)
4. Eğer hala sorun varsa, sunucu log'larına bakın:
   ```bash
   ssh root@46.224.63.208 'cd /opt/shopytrello && docker compose logs web --tail 50'
   ```

