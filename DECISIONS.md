# DECISIONS.md — GOTIX Architectural & Technical Decision Records

Dokumen ini mendokumentasikan alasan arsitektur, trade-off, dan justifikasi teknis di balik implementasi **GOTIX (Ticketing System)**.

---

## 1. Pemilihan Tech Stack: Node.js, Express, TypeScript, PostgreSQL, Prisma

### A. Node.js & Express.js
- **Alasan**: Node.js memiliki model I/O non-blocking berbasis *event loop* yang sangat efisien untuk menangani ribuan koneksi konkuren ringan (seperti pembeli yang melihat katalog event dan memantau status pesanan). Express dipilih karena fleksibel, matang, dan memiliki ekosistem middleware yang luas.
- **Trade-off**: Node.js bersifat single-threaded untuk kalkulasi CPU; namun, operasi ticketing adalah *I/O-bound* (berinteraksi dengan database), sehingga Node.js sangat optimal.

### B. TypeScript Strict Mode
- **Alasan**: Menghilangkan kelas bug runtime seperti `undefined is not a function`, memastikan *data contract* antar layer (Controller, Service, Validator) konsisten, dan mempermudah refactoring.
- **Kebijakan**: Menghindari penggunaan tipe `any`. Semua tipe data domain dan DTO diatur secara eksplisit.

### C. PostgreSQL
- **Alasan**: PostgreSQL adalah Relational Database Management System (RDBMS) kelas enterprise dengan kepatuhan penuh terhadap **ACID** (Atomicity, Consistency, Isolation, Durability). PostgreSQL menyediakan kontrol konkurensi tingkat lanjut seperti **Row-Level Locking (`FOR UPDATE`)** dan isolasi transaksi yang ketat, yang mutlak diperlukan untuk mencegah overselling.
- **Mengapa bukan NoSQL (misal: MongoDB)**: Pada sistem reservasi dengan kuota terbatas, integritas data dan foreign key constraints sangat penting. Relasi antara `Order`, `OrderItem`, `TicketType`, dan `Ticket` bersifat relasional kuat.

### D. Prisma ORM
- **Alasan**: Memberikan *end-to-end type safety* yang dihasilkan langsung dari skema database (`schema.prisma`), migrasi deklaratif yang terstruktur (`prisma migrate`), dan integrasi transaksi interaktif (`prisma.$transaction`).

---

## 2. Arsitektur Monolith vs Microservices & Monorepo

### A. Mengapa Modular Monolith?
- **Konsistensi Transaksi Database**: Dalam proses reservasi tiket, sistem harus membaca kuota, mengunci baris, mengurangi kuota, membuat order, dan menyimpan order items dalam satu kesatuan atomik. Dengan PostgreSQL tunggal pada arsitektur monolith, hal ini diselesaikan dengan `BEGIN ... COMMIT` lokal dalam hitungan milidetik. Pada microservices, kita memerlukan *Distributed Transaction* (Saga Pattern) yang kompleks, rentan kegagalan parsial, dan menimbulkan *eventual consistency lag*.
- **Kemudahan Deployment & Evaluasi**: Seluruh sistem dapat dijalankan dengan satu perintah `docker compose up --build` tanpa ketergantungan pada service broker yang berat.

### B. Struktur Monorepo
- Monorepo menyatukan `backend/`, `frontend/`, dan konfigurasi DevOps dalam satu repository Git, mempermudah pelacakan commit, CI/CD pipeline yang terpadu, dan sinkronisasi kontrak tipe data.

---

## 3. Desain Model Database & Kuota Tiket

### A. Strategi Perhitungan Kuota
Alih-alih hanya menyimpan satu kolom `remainingQuota` yang rawan tidak sinkron, tabel `TicketType` memisahkan kuota menjadi:
1. `totalQuota`: Kapasitas fisik tiket yang tersedia.
2. `reservedQuota`: Jumlah tiket yang sedang ditahan oleh order berstatus `PENDING_PAYMENT`.
3. `paidQuota`: Jumlah tiket yang sudah lunas terbayar (`PAID`).

Formula sisa kuota yang tersedia untuk dipesan:
$$\text{availableQuota} = \text{totalQuota} - (\text{reservedQuota} + \text{paidQuota})$$

**Keuntungan**:
- Jika order dibatalkan atau expired, sistem cukup mengurangi `reservedQuota`.
- `totalQuota` tidak pernah berubah secara tidak sengaja.
- Histori dan audit ketersediaan selalu dapat direkonstruksi.

---

## 4. Mekanisme Concurrency & Pencegahan Overselling

### A. Masalah Race Condition
Jika dua request $A$ dan $B$ membaca sisa kuota $1$ secara bersamaan di memori aplikasi JavaScript, keduanya akan menganggap kuota masih ada dan sama-sama membuat pesanan. Akibatnya terjual $2$ tiket dari kuota $1$ (*overselling*).

### B. Solusi: Database Transaction + Pessimistic Row-Level Lock (`SELECT FOR UPDATE`)
Pada proses pembuatan order:
1. Dimulai transaksi database interaktif (`prisma.$transaction`).
2. Dilakukan query `SELECT * FROM "TicketType" WHERE id = $id FOR UPDATE`. PostgreSQL akan mengunci baris tipe tiket tersebut. Request lain yang ingin mengakses baris yang sama harus mengantre.
3. Di dalam lock, dihitung kuota yang tersedia:
   $$\text{availableQuota} = \text{totalQuota} - (\text{reservedQuota} + \text{paidQuota})$$
4. Jika $\text{availableQuota} < \text{requestedQty}$, transaksi di-`ROLLBACK` dan error `400 Bad Request` dikembalikan.
5. Jika kuota mencukupi, `reservedQuota` ditambah, record `Order` dan `OrderItem` dibuat, lalu transaksi di-`COMMIT`. Baris dilepas dari lock.

---

## 5. Mekanisme Expiry 15 Menit & Pencegahan Double Restoration

### A. Mengapa Bukan `setTimeout` di Memori?
`setTimeout` hanya hidup di memori proses Node.js. Jika server direstart atau crash, seluruh timer yang sedang berjalan akan hilang, menyebabkan kuota tertahan selamanya (*stale reservation*).

### B. Solusi: Polling Scheduler Berbasis Query State
Sistem menggunakan background worker yang berjalan setiap 30 detik (dapat dikonfigurasi via `EXPIRY_WORKER_INTERVAL_MS`).
Worker menjalankan query transaksi:
```sql
-- Temukan order yang sudah melewati batas waktu dan masih PENDING_PAYMENT
SELECT * FROM "Order"
WHERE "status" = 'PENDING_PAYMENT' AND "expiresAt" < NOW()
FOR UPDATE SKIP LOCKED;
```
Untuk setiap order expired:
1. Update status order menjadi `EXPIRED`.
2. Kurangi `reservedQuota` pada `TicketType` terkait sesuai quantity di `OrderItem`.
3. Transaksi di-commit.

### C. Mencegah Double Restoration
Query update order menggunakan klausa kondisional ketat:
```sql
UPDATE "Order" SET "status" = 'EXPIRED' WHERE id = $orderId AND "status" = 'PENDING_PAYMENT';
```
Jika operasi pembatalan manual atau worker lain sudah memproses order tersebut terlebih dahulu, baris yang terpengaruh adalah $0$, sehingga pengembalian kuota tidak akan pernah dieksekusi lebih dari satu kali (*idempotent*).

---

## 6. Pembatasan Maksimal 4 Tiket per Event per User

Aturan bisnis mewajibkan 1 pembeli maksimal memiliki 4 tiket untuk 1 event (akumulasi pesanan `PENDING_PAYMENT` dan `PAID`).
- Pesanan `CANCELLED` dan `EXPIRED` tidak dihitung.
- Validasi dilakukan di dalam transaksi pemesanan dengan menjumlahkan quantity tiket dari seluruh order aktif milik user pada event tersebut:
  $$\text{currentActiveTickets} + \text{newRequestedTickets} \le 4$$
- Jika melebihi 4, transaksi di-rollback seketika.

---

## 7. Idempotency pada Pembayaran & Penerbitan Tiket Unik

### A. Pencegahan Double Payment & Tiket Dobel
- Tabel `Payment` memiliki `unique constraint` pada kolom `orderId`. Satu order hanya dapat memiliki satu transaksi pembayaran sukses.
- Validasi transaksi pembayaran memastikan status order masih `PENDING_PAYMENT` dan waktu saat ini belum melewati `expiresAt`.
- Jika validasi lolos:
  1. Status order diubah menjadi `PAID`.
  2. `reservedQuota` dikurangi dan `paidQuota` ditambah.
  3. Diterbitkan record `Ticket` sejumlah quantity pesanan.
  4. Setiap tiket memiliki kode unik acak berformat `GTX-<ALPHANUMERIC>` dengan `unique index` di database.

### B. Idempotent Payment Webhook
- Tabel `WebhookEvent` menyimpan `eventId` eksternal dengan status `PROCESSED`.
- Jika gateway pembayaran mengirim webhook ulang dengan `eventId` yang sama, sistem mendeteksi keberadaannya di tabel `WebhookEvent` dan langsung merespon `200 OK` tanpa memproses ulang pesanan.

---

## 8. Docker, CI/CD, dan Pengemasan GHCR

1. **Multi-stage Docker Build**:
   - Backend menggunakan Node.js Alpine untuk meminimalkan ukuran image.
   - Frontend di-build menjadi aset statis dan disajikan menggunakan Nginx Alpine.
2. **Database Startup & Migration**:
   - Menggunakan healthcheck pada service `postgres` di `docker-compose.yml`.
   - Menggunakan `npx prisma migrate deploy` saat startup container (bukan `prisma migrate dev`) untuk menjamin konsistensi skema produksi.
3. **GitHub Actions CI/CD**:
   - Otomatis menjalankan unit testing dan integration testing terhadap instance PostgreSQL nyata di container runner.
   - Build image Docker dan push ke GitHub Container Registry (GHCR) dengan tag `commit SHA` unik untuk *traceability*, disertai tag `latest`.
