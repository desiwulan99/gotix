# GOTIX

Platform backend penjualan tiket event dengan kuota terbatas dan tema *Subtle Gothic Luxury*. Setiap event memiliki minimal dua tipe tiket (Regular, VIP) dengan kuota dan harga masing-masing. Pesanan menahan kuota selama 15 menit, maksimal 4 tiket per pembeli per event, pembayaran disimulasikan, dan tiket diterbitkan tepat sekali per pesanan tanpa duplikasi.

Stack: Node.js 20, Express.js, TypeScript strict, PostgreSQL 16, Prisma ORM, Docker Compose. Test dengan Vitest + Supertest.

---

## Jalankan dari mesin bersih

Syarat: Docker dan Docker Compose.

```bash
git clone <repo> && cd gotix
docker compose up --build
```

Seluruh sistem (Database, Backend API, dan Frontend) langsung berjalan dengan satu perintah:
- **Frontend UI**: `http://localhost:8080` (atau `http://localhost:5173`)
- **Backend API**: `http://localhost:5000` (atau `http://localhost:3000`)
- **PostgreSQL**: `localhost:5432`

Perintah di atas menyalakan PostgreSQL (dengan healthcheck), menjalankan migrasi skema Prisma, mengeksekusi seed data kurasi gothic secara otomatis, lalu menyalakan server produksi.

Cek kesiapan backend dengan:

```bash
curl http://localhost:5000/api/health
# {"success":true,"data":{"status":"UP","database":"CONNECTED","timestamp":"..."}}
```

> **Catatan:** Jika sebelumnya pernah ada volume PostgreSQL lama di mesin Anda, jalankan `docker compose down -v` terlebih dahulu agar database dan migrasi dibuat ulang dari kondisi bersih.

---

## Frontend demo

Aplikasi web demo bertema *Subtle Gothic Luxury* sudah langsung aktif di dalam container Nginx pada port `8080`.

Buka di browser:
```
http://localhost:8080
```

Akun demo yang sudah disiapkan otomatis melalui seed:
- **Admin**: `admin@gotix.id` | Password: `AdminPass123!`
- **Buyer**: `buyer1@example.com` | Password: `BuyerPass123!`

Fitur utama pada UI:
- **Kurasi 4 Kategori**: Pilihan pertunjukan *Orchestra*, *Teater & Seni*, *Konser & Musik*, dan *Exhibition*.
- **Poster Kartu Tarot Neoklasik**: Menggunakan foto pertunjukan beresolusi tinggi dengan vignette gelap dan tipografi gotik mandiri (*offline-ready* tanpa CDN luar).
- **Stepper Kuota Dinamis**: Pilihan tiket terikat langsung dengan sisa kuota kursi riil (`remaining`), otomatis dinonaktifkan saat mencapai kapasitas kursi.

Jika ingin menjalankan frontend terpisah di luar Docker untuk keperluan pengembangan:

```bash
cd frontend
npm install
npm run dev
```

---

## Alur demo (copy paste)

Gunakan terminal bash dengan alat `curl` dan `jq`.

```bash
# 1. Registrasi atau Login pembeli untuk mendapatkan JWT token
BUYER_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"buyer_demo@gotix.id","password":"BuyerPass123!","fullName":"Gothic Pilgrim"}' \
  | jq -r .data.token)

# 2. Lihat daftar event dan sisa kuota tiap tipe tiket
EVENTS=$(curl -s http://localhost:5000/api/events)
echo "$EVENTS" | jq '.data[0] | {title, location, ticketTypes: [.ticketTypes[] | {name, price, quota, remaining}]}'

EVENT_ID=$(echo "$EVENTS" | jq -r '.data[0].id')
REGULAR_ID=$(echo "$EVENTS" | jq -r '.data[0].ticketTypes[] | select(.name=="Regular") | .id')

# 3. Pembeli memesan 2 tiket. Kuota langsung ditahan (PENDING_PAYMENT)
ORDER=$(curl -s -X POST http://localhost:5000/api/orders \
  -H 'content-type: application/json' \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -d "{\"eventId\":\"$EVENT_ID\",\"items\":[{\"ticketTypeId\":\"$REGULAR_ID\",\"quantity\":2}]}")
echo "$ORDER" | jq '.data | {id, status, totalPrice, expiresAt}'
ORDER_ID=$(echo "$ORDER" | jq -r .data.id)

# 4. Sisa kuota berkurang seketika walau belum dibayar
curl -s http://localhost:5000/api/events/$EVENT_ID | jq '.data.ticketTypes[] | {name, quota, reservedCount, remaining}'

# 5. Tandai pesanan lunas, tiket dengan kode unik langsung terbit
curl -s -X POST http://localhost:5000/api/orders/$ORDER_ID/pay \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  | jq '.data | {orderId: .id, status, tickets: [.tickets[] | {code, ticketType: .ticketType.name}]}'

# 6. Lihat riwayat pesanan dan tiket aktif pembeli
curl -s http://localhost:5000/api/orders -H "Authorization: Bearer $BUYER_TOKEN" | jq '.data[] | {id, status, totalPrice}'
curl -s http://localhost:5000/api/tickets/my-tickets -H "Authorization: Bearer $BUYER_TOKEN" | jq '.data[] | {code, event: .event.title, type: .ticketType.name, status}'
```

Pembatalan pesanan sebelum bayar langsung membebaskan kuota seketika:

```bash
curl -s -X POST http://localhost:5000/api/orders/$ORDER_ID/cancel \
  -H "Authorization: Bearer $BUYER_TOKEN" | jq .data.status
```

Pesanan yang tidak dibayar dalam 15 menit akan kedaluwarsa secara otomatis dan kuotanya dikembalikan ke publik oleh worker.

---

## Cara menandai pesanan lunas

Sistem menyediakan dua cara pembayaran yang disimulasikan:

### 1. Endpoint Simulasi Langsung
Satu panggilan API untuk pengujian instan:

```bash
curl -s -X POST http://localhost:5000/api/orders/$ORDER_ID/pay \
  -H "Authorization: Bearer $BUYER_TOKEN" | jq
```

### 2. Webhook Pembayaran (Meniru Provider Sungguhan)
Menerima payload webhook lengkap dengan tanda tangan HMAC SHA-256 atas body mentah (`rawBody`):

```bash
SECRET="gotix_webhook_hmac_secret_key_2026"
BODY="{\"eventId\":\"evt-demo-101\",\"orderId\":\"$ORDER_ID\",\"type\":\"payment.succeeded\",\"amount\":500000}"

# Hitung signature HMAC SHA-256
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | awk '{print $NF}')

curl -s -X POST http://localhost:5000/api/payments/webhook \
  -H 'content-type: application/json' \
  -H "x-gotix-signature: $SIG" \
  -d "$BODY" | jq
```

- **Idempotensi Webhook**: Mengirim ulang webhook yang sama menghasilkan respons idempoten 200 OK dengan tiket yang identik (bukan menerbitkan tiket baru).
- **Proteksi Kedaluwarsa**: Webhook yang tiba setelah pesanan kedaluwarsa akan ditolak dan tidak menerbitkan tiket.
- **Tanda Tangan Tidak Valid**: Permintaan dengan signature salah dibalas `401 Unauthorized`.

---

## Uji otomatis

Seluruh pengujian integrasi dijalankan langsung di atas basis data PostgreSQL sungguhan (bukan mock memory):

Jalankan test dari root:

```bash
npm --prefix backend test
```

Atau jalankan test di dalam container backend:

```bash
docker exec -it gotix-backend npm test
```

Test mencakup 7 pengujian komprehensif:
1. **TEST 1**: Alur pembelian lengkap dari reservasi, penahanan kuota, pembayaran, hingga tiket berkode unik terbit.
2. **TEST 2**: *Sold out* saat kuota habis melempar HTTP 409 dan memastikan kuota tidak negatif.
3. **TEST 3**: Kedaluwarsa 15 menit mengembalikan kuota dan menolak pembayaran susulan.
4. **TEST 4**: Pembatalan pesanan mengembalikan kuota dan bersifat idempoten.
5. **TEST 5**: Batas 4 tiket per event memblokir pesanan ke-5 dan menahan request paralel dari user yang sama.
6. **TEST 6**: Idempotensi pembayaran pada webhook ganda dan pembayaran paralel simultan.
7. **TEST 7**: Uji stres konkurensi 200 pesanan bersamaan untuk kuota 100 tiket.

---

## Bukti 200 pesanan bersamaan

Test konkurensi menguji skenario ekstrem: 200 user berbeda menembakkan permintaan reservasi secara simultan di milidetik yang sama untuk memperebutkan kuota 100 tiket.

Jalankan test konkurensi:

```bash
npm --prefix backend test tests/concurrency/concurrent-orders.test.ts
```

Output nyata pada sistem:

```
=====================================================
      CONCURRENCY STRESS TEST RESULT SUMMARY         
=====================================================
Total Requests      : 200
Initial Quota       : 100
Success (201)       : 100
Sold Out (409)      : 100
Other Statuses      : 0
Final ReservedCount : 100
Final Remaining     : 0
Execution Duration  : 986ms
Overselling Status  : PASSED (Zero Overselling)
=====================================================
```

Bukti hasil pengujian tersimpan dalam bentuk artefak JSON di [backend/tests/evidence/concurrency-result.json](backend/tests/evidence/concurrency-result.json).

---

## CI/CD

Pipeline integrasi berkelanjutan dikonfigurasi pada file [.github/workflows/ci.yml](.github/workflows/ci.yml):

1. **Lint & Test**: Dijalankan pada setiap *push* dan *pull request* ke branch `main`. Service container PostgreSQL 16 dihidupkan untuk mengeksekusi seluruh integration test.
2. **Build & Push Image**: Jika seluruh pengujian hijau, GitHub Actions membangun multi-stage Docker image backend dan frontend, lalu mengunggahnya ke GitHub Container Registry (GHCR).
3. **Immutable Tagging**: Image diberi label tag spesifik berdasarkan commit SHA (bukan hanya `latest`):

```
ghcr.io/<owner>/gotix-backend:sha-<commit-sha>
ghcr.io/<owner>/gotix-frontend:sha-<commit-sha>
```

---

## Endpoint API

| Method | Path | Keterangan |
|---|---|---|
| `GET` | `/api/health` | Status kesehatan API & database PostgreSQL |
| `POST` | `/api/auth/register` | Pendaftaran akun baru (Buyer / Admin) |
| `POST` | `/api/auth/login` | Autentikasi dan penerbitan JWT token |
| `GET` | `/api/auth/me` | Profil pengguna aktif |
| `GET` | `/api/events` | Daftar seluruh event beserta kuota dan harga |
| `GET` | `/api/events/:id` | Detail event dan informasi stok terkini |
| `POST` | `/api/events` | Membuat event baru (Khusus Role ADMIN) |
| `POST` | `/api/orders` | Memesan 1-4 tiket event (Menahan kuota) |
| `GET` | `/api/orders` | Riwayat pesanan milik pembeli aktif |
| `GET` | `/api/orders/:id` | Detail pesanan spesifik beserta tiketnya |
| `POST` | `/api/orders/:id/cancel` | Membatalkan pesanan (Mengembalikan kuota) |
| `POST` | `/api/orders/:id/pay` | Simulasi pembayaran pesanan menjadi lunas |
| `POST` | `/api/payments/webhook` | Webhook penyedia pembayaran (Wajib HMAC) |
| `GET` | `/api/tickets/my-tickets` | Daftar seluruh tiket aktif milik pembeli |

---

## Struktur Repository

```
gotix/
├── backend/
│   ├── prisma/             # Skema Prisma, migrasi SQL, dan script seed
│   ├── src/
│   │   ├── config/         # Environment variable & inisialisasi Prisma
│   │   ├── controllers/    # Controller HTTP layer Express
│   │   ├── middlewares/    # Auth JWT, error handler, rate limiter
│   │   ├── routes/         # Routing Express REST API
│   │   ├── services/       # Core business logic (Order, Payment, Event)
│   │   ├── utils/          # Code generator, response wrapper, custom errors
│   │   ├── validators/     # Skema validasi request input Zod
│   │   └── workers/        # Polling worker kedaluwarsa pesanan
│   ├── tests/              # Integration & 200 concurrent orders stress test
│   └── Dockerfile          # Multi-stage build runner non-root
├── frontend/
│   ├── public/images/      # Aset gambar offline kurasi pertunjukan
│   ├── src/
│   │   ├── components/     # EventCard, EventPoster, Navbar, UI components
│   │   ├── pages/          # Home, Events, Detail, Checkout, MyTickets, Admin
│   │   └── services/       # Client Axios API
│   ├── nginx.conf          # Reverse proxy config (/api -> backend)
│   └── Dockerfile          # Multi-stage build Nginx Alpine
├── docker-compose.yml      # Orkestrasi container PostgreSQL, Backend, Frontend
├── DECISIONS.md            # Catatan alasan arsitektur & trade-off desain
└── README.md               # Panduan instruksi instalasi & evaluasi sistem
```

---

## Konfigurasi Environment

| Variabel | Default di Docker | Keterangan |
|---|---|---|
| `DATABASE_URL` | `postgresql://gotix_user:gotix_password@postgres:5432/gotix_db` | URL koneksi basis data PostgreSQL |
| `PORT` | `5000` | Port server Express |
| `JWT_SECRET` | `super_secret_jwt_key_for_gotix_subtle_gothic_luxury_2026` | Kunci enkripsi token autentikasi |
| `JWT_EXPIRES_IN` | `7d` | Masa aktif token autentikasi |
| `ORDER_EXPIRY_MINUTES` | `15` | Waktu kedaluwarsa reservasi pesanan |
| `WEBHOOK_SECRET` | `gotix_webhook_hmac_secret_key_2026` | Kunci rahasia HMAC SHA-256 webhook |
| `EXPIRY_INTERVAL_MS` | `30000` | Frekuensi pemeriksaan background worker |

---

## Kenapa desainnya begini?

Untuk penjelasan mendalam mengenai trade-off penguncian baris PostgreSQL, pencegahan deadlock, kalkulasi kuota, dan arsitektur konkurensi, silakan baca [DECISIONS.md](DECISIONS.md).
