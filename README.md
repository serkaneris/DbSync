# Vertical Slice Sync (Node.js + MSSQL)

- Dosya adları **İngilizce**, method/fonksiyon adları **Türkçe** bırakıldı.
- Vertical Slice dilimleri: `health`, `setup`, `sync` (consumer), `producer`.

## Kurulum
```bash
cd DbSync
npm i
```
`.env` dosyası yerine örnekler:
- `env/.env.app1`
- `env/.env.app2`

Çalıştırırken hangisini kullanacağını seç:
```bash
ENV_PATH=env/.env.app1 CONFIG_PATH=./config.json node index.js
# veya
ENV_PATH=env/.env.app2 CONFIG_PATH=./config.json node index.js
```

## HTTP Uçları
- `GET /api-status` → basit sağlık kontrolü
- `POST /apply-changes` → tüketici (consumer) uç. Gövde: `{ table, rows }`
  - Başlıkta: `x-auth: <SHARED_SECRET>`

## Producer
Uygulama açıldığında `producer` dilimi `CONFIG.flows` listesindeki tablolar için
periyodik olarak değişiklikleri gönderir.

## Notlar
- `CONFIG.enableChangeTracking` true ise veritabanı ve tablo bazında CT otomatik etkinleşir.
- İlk açılışta `dbo.SyncState` tablosu yoksa oluşturulur.
