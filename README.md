# GOTIX — Unlock the Unknown
### Final Project Back-End Intermediate | Full-Stack Ticketing System

[![CI/CD Pipeline](https://github.com/OWNER/gotix/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/gotix/actions)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=flat&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=flat&logo=Prisma&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)

---

## 1. Deskripsi Project

**GOTIX** adalah platform penjualan tiket event eksklusif berbasis web dengan tema visual *Subtle Gothic Luxury*. Aplikasi ini dirancang untuk mengatasi tantangan kritis dalam sistem *high-demand ticketing* / *flash sale*, antara lain:
- **Pencegahan Overselling 100%**: Menjamin tidak ada tiket yang terjual melebihi kapasitas fisik kuota dengan menerapkan **PostgreSQL Row-Level Locking (`SELECT ... FOR UPDATE`)** dan **Database Transactions**.
- **Mekanisme Reservasi 15 Menit**: Menahan (*hold*) kuota pesanan yang belum dibayar selama tepat 15 menit.
- **Pemulihan Stok Otomatis & Idempoten**: Latar belakang worker memeriksa pesanan kedaluwarsa secara berkala dan memulihkan kuota tepat satu kali tanpa ada tiket yang *double count* atau hilang.
- **Batasan Pembelian Ketat**: Membatasi maksimal 4 tiket per event untuk 1 pembeli (akumulasi pesanan aktif dan lunas).
- **Idempotency Pembayaran & Webhook**: Mencegah tiket terbit dua kali akibat penekanan ganda (*duplicate request*) atau *retry* webhook dari payment gateway.
- **Infrastruktur Modern**: Berjalan secara lokal dalam satu perintah `docker compose up --build`, serta terintegrasi CI/CD GitHub Actions dengan pengemasan image ke GitHub Container Registry (GHCR) bertag `commit SHA`.

---

## 2. Branding & Identitas GOTIX

- **Nama**: GOTIX
- **Tagline**: *Unlock the Unknown.*
- **Brand Personality**: Elegant, Mysterious, Premium, Modern, Minimalist.
- **Visual Direction**: *Subtle Gothic Luxury* (Dark Luxury Interface beraksen arsitektur katedral dan palet neoklasik).
- **Color Palette**:
  - **Obsidian Black**: `#0D0B10` (Background utama)
  - **Charcoal**: `#19151D` (Card & container)
  - **Royal Plum**: `#392544` (Aksen tombol & border)
  - **Muted Violet**: `#80658F` (Ikon & highlight teks)
  - **Silver Mist**: `#C8C1CE` (Teks sekunder)
  - **Ivory White**: `#F2EFF4` (Teks judul & elemen penting)
- **Typography**: `Cinzel` untuk heading dan judul event, `Inter` untuk body teks dan formulir.

---

## 3. Tech Stack

### Backend
- **Runtime & Framework**: Node.js & Express.js
- **Language**: TypeScript Strict Mode
- **Database & ORM**: PostgreSQL & Prisma ORM
- **Validation**: Zod (Runtime Schema Validator)
- **Security**: JWT (JSON Web Tokens) & bcrypt (Password Hashing)
- **Testing**: Vitest & Supertest

### Frontend
- **Framework & Tooling**: React & Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing & Networking**: React Router DOM & Axios
- **Icons**: Lucide React

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server Frontend**: Nginx Alpine
- **CI/CD**: GitHub Actions
- **Container Registry**: GitHub Container Registry (GHCR)

---

## 4. Arsitektur Sistem

```
[ User Browser ]
       ↓
[ Frontend (React SPA via Nginx) ] → Port 5173
       ↓ HTTP REST API
[ Backend (Express + TypeScript) ] → Port 5000
  ├── CORS & Auth Middlewares (JWT)
  ├── Zod Request Validation
  ├── Controllers & Services (Business Rules)
  ├── Concurrency Lock: PostgreSQL FOR UPDATE
  └── Background Expiry Worker (Interval Scheduler)
       ↓ TCP Connection
[ Database (PostgreSQL 16) ] → Port 5432
```

---

## 5. Struktur Repository

```
gotix/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Skema database relasional Prisma
│   │   ├── migrations/            # Histori migrasi database
│   │   └── seed.ts                # Data awal untuk demonstrasi
│   ├── src/
│   │   ├── config/                # Environment variables & prisma singleton
│   │   ├── controllers/           # HTTP Request & Response Handlers
│   │   ├── middlewares/           # Auth JWT, Error Handler, Zod Validator
│   │   ├── routes/                # REST API Routing
│   │   ├── services/              # Domain Services (Order, Payment, Event, Auth)
│   │   ├── validators/            # Zod validation schema
│   │   ├── workers/               # Expiry Background Worker (15 menit)
│   │   ├── utils/                 # Generator Kode Tiket Unik & Response Helpers
│   │   ├── types/                 # Custom TypeScript interfaces
│   │   ├── app.ts                 # Definisi Express App
│   │   └── server.ts              # Entrypoint server & Graceful Shutdown
│   ├── tests/
│   │   ├── setup.ts               # Database cleaner utility
│   │   ├── integration/           # Automated integration tests (Test 1 - 6)
│   │   └── concurrency/           # Stress test concurrency (Test 7: 200 reqs)
│   ├── Dockerfile                 # Multi-stage Dockerfile Backend
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── frontend/
│   ├── src/
│   │   ├── components/            # Navbar, Footer, EventCard
│   │   ├── context/               # AuthContext (JWT State Management)
│   │   ├── pages/                 # Home, Events, Detail, Checkout, MyTickets, Admin, Auth
│   │   ├── services/              # Axios API Client
│   │   ├── types/                 # TypeScript interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css              # Styling Gothic Luxury & Custom Scrollbar
│   ├── Dockerfile                 # Multi-stage Dockerfile (Nginx Alpine)
│   ├── nginx.conf                 # Konfigurasi SPA routing Nginx
│   ├── package.json
│   ├── tailwind.config.ts
│   └── vite.config.ts
│
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI/CD Pipeline
├── docker-compose.yml             # Orkestrasi 1 Perintah (Postgres, Backend, Frontend)
├── .env.example                   # Template konfigurasi environment
├── .gitignore
├── README.md                      # Dokumentasi komprehensif
└── DECISIONS.md                   # Rekam keputusan arsitektur (Bobot nilai 30%)
```

---

## 6. Prasyarat Instalasi

Sebelum menjalankan aplikasi, pastikan komputer Anda telah terpasang:
1. **Docker Desktop** (versi 20.x ke atas) dengan **Docker Compose**.
2. **Node.js** (versi 20.x atau 22.x LTS) *(opsional jika hanya menjalankan via Docker)*.
3. **Git**.

---

## 7. Cara Menjalankan Menggunakan Satu Perintah Docker Compose

Langkah ini adalah target utama evaluasi lokal. Dengan satu perintah, PostgreSQL, Backend Express, dan Frontend React akan otomatis dibangun dan berjalan:

```bash
# 1. Clone repository
git clone https://github.com/OWNER/gotix.git
cd gotix

# 2. Buat file .env dari template
cp .env.example .env

# 3. Jalankan seluruh sistem
docker compose up --build
```

Setelah proses build selesai:
- **Frontend GOTIX**: Buka browser di [http://localhost:5173](http://localhost:5173)
- **Backend API**: Berjalan di [http://localhost:5000](http://localhost:5000)
- **Health Check API**: [http://localhost:5000/health](http://localhost:5000/health)

### Akun Bawaan (Pre-seeded Users):
- **Admin**: `admin@gotix.com` | Password: `admin123`
- **Customer 1**: `alex@example.com` | Password: `customer123`
- **Customer 2**: `sarah@example.com` | Password: `customer123`

### Cara Menghentikan Container:
```bash
# Menghentikan container
docker compose down

# Menghentikan container dan menghapus volume database secara bersih:
docker compose down -v
```

---

## 8. Menjalankan Secara Manual (Development Non-Docker)

Jika ingin menjalankan aplikasi langsung di terminal lokal:

### A. Setup Backend & Database
```bash
cd backend
npm install
cp ../.env.example .env

# Pastikan PostgreSQL lokal Anda menyala dengan kredensial sesuai .env
# Jalankan migrasi dan seeding data:
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed

# Jalankan backend dalam mode development:
npm run dev
```

### B. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Akses frontend di `http://localhost:5173`.

---

## 9. Menjalankan Automated Tests

Seluruh pengujian unit, integrasi, dan uji konkurensi 200 request dijalankan menggunakan **Vitest** terhadap instance PostgreSQL:

```bash
cd backend

# Jalankan seluruh test suite:
npm test
```

### Daftar Skenario Uji:
1. **Test 1 — Purchase to Ticket**: Membuat order, kuota tertahan, pembayaran simulasi berhasil, tiket unik diterbitkan dengan format `GTX-XXXX-XXXX`.
2. **Test 2 — Sold Out**: Kuota habis menolak pembelian berikutnya dan sisa kuota tidak pernah bernilai negatif.
3. **Test 3 — Order Expiration**: Pesanan melewati batas 15 menit otomatis diubah menjadi `EXPIRED`, kuota kembali, dan pesanan ditolak saat dicoba bayar.
4. **Test 4 — Cancellation**: Pembatalan pesanan mengembalikan kuota secara atomik; pembatalan ulang tidak menambah kuota ganda (*idempotent*).
5. **Test 5 — Maximum Ticket Limit**: User dibatasi maksimal 4 tiket untuk 1 event. Pembelian tiket ke-5 ditolak oleh sistem.
6. **Test 6 — Idempotent Webhook**: Pemanggilan webhook dengan `eventId` yang sama dua kali hanya memproses pesanan dan tiket satu kali.
7. **Test 7 — Concurrency Stress Test**: 200 request simultan ditembakkan bersamaan untuk merebut 100 kuota: **Tepat 100 sukses, tepat 100 gagal, sisa stok tepat 0**.

---

## 10. Daftar REST API Endpoints

### Autentikasi
| Method | Endpoint | Deskripsi | Akses |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Mendaftarkan akun baru | Publik |
| `POST` | `/api/auth/login` | Login & mendapatkan JWT token | Publik |
| `GET` | `/api/auth/me` | Mengambil profil user yang sedang login | Autentikasi |

### Events & Tipe Tiket
| Method | Endpoint | Deskripsi | Akses |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/events` | Mendapatkan semua event & sisa kuota | Publik |
| `GET` | `/api/events/:id` | Detail event beserta tipe tiketnya | Publik |
| `POST` | `/api/events` | Membuat event baru (Minimal Regular & VIP) | Admin |
| `PATCH` | `/api/events/:id` | Memperbarui data event | Admin |
| `POST` | `/api/events/:id/ticket-types` | Menambah tipe tiket pada event | Admin |

### Pesanan (Orders)
| Method | Endpoint | Deskripsi | Akses |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders` | Membuat reservasi tiket (Tahan 15 menit) | Autentikasi |
| `GET` | `/api/orders` | Riwayat pesanan milik pengguna | Autentikasi |
| `GET` | `/api/orders/admin/all` | Melihat seluruh pesanan dalam sistem | Admin |
| `GET` | `/api/orders/:id` | Detail pesanan tertentu | Pemilik / Admin |
| `POST` | `/api/orders/:id/cancel` | Membatalkan pesanan & mengembalikan stok | Pemilik / Admin |

### Pembayaran & Tiket
| Method | Endpoint | Deskripsi | Akses |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders/:id/pay` | Simulasi pembayaran & penerbitan tiket | Autentikasi |
| `POST` | `/api/webhooks/payment` | Webhook simulasi dengan Idempotency Key | Publik / Gateway |
| `GET` | `/api/tickets` | Daftar seluruh tiket aktif milik pengguna | Autentikasi |
| `GET` | `/api/tickets/:id` | Detail tiket beserta kode unik | Pemilik / Admin |

---

## 11. Contoh Request & Response

### Membuat Reservasi Tiket
**Request:**
```http
POST /api/orders
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "items": [
    {
      "ticketTypeId": "98765432-10fe-dcba-0987-654321fedcba",
      "quantity": 2
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Pesanan berhasil dibuat. Silakan bayar dalam 15 menit",
  "data": {
    "id": "e8a93e31-807d-411a-a5f1-37d45ba89c02",
    "userId": "usr_9981",
    "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "PENDING_PAYMENT",
    "totalAmount": "500000.00",
    "expiresAt": "2026-11-20T11:45:00.000Z",
    "items": [
      {
        "id": "item_123",
        "ticketTypeId": "98765432-10fe-dcba-0987-654321fedcba",
        "quantity": 2,
        "unitPrice": "250000.00"
      }
    ]
  }
}
```

---

## 12. Mekanisme Kritis Backend

### A. Pencegahan Concurrency & Overselling
Saat pembuatan pesanan dijalankan, Prisma mengeksekusi query tingkat rendah:
```sql
SELECT id, "totalQuota", "reservedQuota", "paidQuota"
FROM "TicketType"
WHERE id = $id AND "eventId" = $eventId
FOR UPDATE;
```
Klausa `FOR UPDATE` di PostgreSQL menahan *exclusive lock* pada baris tiket tersebut. Permintaan lain yang datang bersamaan harus menunggu hingga transaksi pertama selesai (`COMMIT` atau `ROLLBACK`). Dengan demikian, sisa kuota yang dibaca oleh sistem selalu akurat dan terlindungi dari kondisi balapan (*race condition*).

### B. Mekanisme Expiration 15 Menit & Pencegahan Double Restoration
Sebuah *background worker* (`expiry.worker.ts`) dieksekusi secara berkala (default: tiap 30 detik).
1. Worker melakukan pencarian transaksi:
   ```sql
   SELECT id FROM "Order"
   WHERE "status" = 'PENDING_PAYMENT' AND "expiresAt" < NOW()
   FOR UPDATE;
   ```
2. Mengubah status order menjadi `EXPIRED`.
3. Mengurangi kolom `reservedQuota` sebesar jumlah tiket yang dipesan.
4. **Pencegahan Double Restoration**: Pembaruan kuota dibungkus dengan validasi status order. Jika pesanan telah dibatalkan sebelumnya, kueri pembaruan menghasilkan $0$ baris terpengaruh sehingga kuota tidak pernah dikembalikan dua kali.

### C. Idempotency Tiket & Webhook
1. Tabel `Payment` memiliki indeks unik pada `orderId`. Satu pesanan hanya dapat berstatus dibayar satu kali.
2. Tabel `WebhookEvent` menyimpan `eventId` unik dari gateway pembayaran. Jika event ID yang sama diterima ulang, sistem langsung mengembalikan status sukses tanpa menerbitkan tiket tambahan.

---

## 13. Bukti Pengujian Konkurensi (200 Request pada 100 Kuota)

Berikut adalah log hasil uji otomatis dari suite pengujian `backend/tests/concurrency/concurrent-orders.test.ts`:

```
 ✓ tests/concurrency/concurrent-orders.test.ts (1 test) 1542ms
   ✓ CONCURRENCY STRESS TEST — 200 Requests for 100 Quota
     [CONCURRENCY SETUP] Menyiapkan 200 user simultan...
     [CONCURRENCY EXECUTION] Meluncurkan 200 request bersamaan...
     [CONCURRENCY RESULTS]
      - Sukses (201 Created)     : 100
      - Gagal  (400 Bad Request) : 100
      - Total Request Dikirim    : 200
      - Sisa Kuota di Database   : 0 (Tidak ada overselling)
```

---

## 14. GitHub Actions CI/CD & GHCR

Workflow GitHub Actions (`.github/workflows/ci.yml`) dijalankan pada setiap event `push` dan `pull_request` ke branch utama:
1. Menjalankan service container **PostgreSQL 16**.
2. Mengeksekusi migrasi database (`prisma migrate deploy`).
3. Menjalankan seluruh pengujian otomatis (`npm test`).
4. Memvalidasi tipe data TypeScript dan compile build (`tsc`).
5. Membangun multi-stage Docker image untuk Backend dan Frontend.
6. Login dan mengunggah image ke **GitHub Container Registry (GHCR)** dengan format tag:
   - `ghcr.io/OWNER/gotix-backend:<COMMIT_SHA>`
   - `ghcr.io/OWNER/gotix-backend:latest`
   - `ghcr.io/OWNER/gotix-frontend:<COMMIT_SHA>`
   - `ghcr.io/OWNER/gotix-frontend:latest`

---

## 15. Troubleshooting

- **Port 5432 atau 5000 sudah terpakai**:
  Pastikan tidak ada instance PostgreSQL lokal lain yang sedang berjalan di port 5432 sebelum menjalankan `docker compose up`.
- **Database belum siap saat backend dijalankan**:
  `docker-compose.yml` telah dilengkapi dengan blok `healthcheck: test: ["CMD-SHELL", "pg_isready -U gotix_user -d gotix_db"]` dan backend memiliki konfigurasi `condition: service_healthy` untuk menjamin database siap 100% sebelum backend memulai koneksi.
- **Mereset database ke kondisi awal bersih**:
  Jalankan `docker compose down -v` kemudian `docker compose up --build`.

---
*GOTIX — Unlock the Unknown.*
