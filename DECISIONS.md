# Keputusan Desain

Dokumen ini menjawab satu pertanyaan: kenapa sistem GOTIX dibuat begini, dan apa yang dikorbankan.

---

## Ringkasan satu menit

- **Kuota dijaga dengan counter atomik**: Sisa tiket adalah `quota - reservedCount`. Pengurangan kuota memakai single atomic conditional update `WHERE reservedCount + qty <= quota`, dilapisi `CHECK` constraint di PostgreSQL. Zero overselling.
- **Batas 4 tiket dikunci per pembeli dan event**: Memakai PostgreSQL transaction advisory lock pada `(userId:eventId)`. Pembeli yang menembak dua pesanan bersamaan akan antre, sementara pembeli lain tidak terganggu.
- **Kedaluwarsa 15 menit dua lapis**: Worker 30 detik membalikkan kuota dan merapikan label status. Endpoint pembayaran juga mengecek waktu kedaluwarsa secara mandiri (lazy guard) di bawah lock.
- **Pembayaran idempoten**: Transaksi row lock pada pesanan, verifikasi HMAC SHA-256 pada body mentah, tabel ledger `WebhookEvent` dengan `eventId` unik, dan constraint unik `(orderItemId, seq)` pada tiket.
- **Harga adalah snapshot kontrak**: Disalin ke `unitPrice` di tabel `OrderItem` saat memesan. Perubahan harga event di masa depan tidak mengubah tagihan pesanan yang sudah dibuat.
- **Satu perintah jalan**: Monolith modular dalam Docker Compose (`postgres`, `backend`, `frontend` Nginx). Tanpa Redis, tanpa microservice, tanpa dependensi cloud.

---

## 1. Kuota: Counter atomik vs Menghitung dinamis

Sisa tiket dihitung dari:

```
sisa = quota - reservedCount
```

Setiap reservasi melakukan satu query SQL atomik:

```sql
UPDATE "TicketType"
SET "reservedCount" = "reservedCount" + $qty,
    "updatedAt" = NOW()
WHERE id = $id AND ("reservedCount" + $qty) <= "quota"
RETURNING *;
```

Sabuk pengaman terakhir di level PostgreSQL:

```sql
ALTER TABLE "TicketType" ADD CONSTRAINT "check_ticket_type_reserved_count_quota"
CHECK ("reservedCount" >= 0 AND "reservedCount" <= "quota");
```

**Kenapa memilih counter atomik:**
1. **Performa $O(1)$**: Membaca sisa kuota dan mengurangi kursi hanya menyentuh satu baris indeks unik, tanpa perlu `SUM()` seluruh baris pesanan setiap milidetik.
2. **Zero Overselling native**: PostgreSQL mengeksekusi `UPDATE` secara atomik pada baris data. Jika kuota tersisa 2 tapi ada permintaan 3 tiket, `affected rows` bernilai 0 dan sistem langsung melempar error `409 Sold Out`.
3. **Pemberitahuan instan**: Tidak ada celah di mana dua transaksi membaca kuota yang sama lalu keduanya mengira masih ada sisa kursi.

**Yang dikorbankan:**
Disiplin mutasi counter. Setiap status pesanan yang berubah menjadi `CANCELLED` atau `EXPIRED` wajib mengurangkan kembali `reservedCount`. Jika ada proses crash sebelum kuota dikembalikan, counter bisa melenceng. Karena itu, mutasi selalu dibungkus dalam transaksi database lokal (`prisma.$transaction`) dan diverifikasi oleh worker berkala.

---

## 2. Batas 4 tiket per event: Advisory Lock

Kebutuhan bisnis: satu pembeli maksimal 4 tiket per event, dihitung dari semua pesanan aktif (`PENDING_PAYMENT`) dan yang sudah dibayar (`PAID`).

**Permasalahan race condition:**
Seorang pembeli membuka dua tab browser atau menjalankan skrip paralel:
- Tab 1 memesan 3 tiket.
- Tab 2 memesan 2 tiket.
Keduanya ditembakkan di detik yang sama. Tanpa kunci, kedua transaksi memeriksa pesanan aktif pembeli, keduanya melihat "belum punya tiket (0)", keduanya lolos, dan pembeli mendapatkan 5 tiket.

**Solusi: `pg_advisory_xact_lock`**

Di awal pembuatan order, sistem mengunci:

```sql
SELECT pg_advisory_xact_lock(hashtext($userId || ':' || $eventId));
```

**Kenapa mengunci `(userId, eventId)`, bukan seluruh tabel atau seluruh event:**
- **Konkurensi tinggi**: Kunci ini hanya menahan permintaan dari *user yang sama* pada *event yang sama*.
- Pembeli B, C, dan D yang sedang berebut tiket di event yang sama berjalan paralel tanpa saling tunggu. Uji nyata membuktikan 200 pembeli berbeda bisa memesan bersamaan dalam hitungan 1 detik.
- Kunci ini otomatis dilepas oleh PostgreSQL saat transaksi `COMMIT` atau `ROLLBACK`, sehingga tidak ada risiko kunci tertinggal jika server mati.

---

## 3. Pencegahan deadlock pada multi-tipe tiket

Pembeli bisa memesan tiket campuran dalam satu pesanan (misalnya 1 Regular dan 1 VIP, selama totalnya $\le 4$).

**Potensi deadlock:**
- Transaksi A memesan [Regular, VIP] $\rightarrow$ mengunci Regular, mencoba mengunci VIP.
- Transaksi B memesan [VIP, Regular] $\rightarrow$ mengunci VIP, mencoba mengunci Regular.
- Kedua transaksi saling tunggu $\rightarrow$ PostgreSQL mendeteksi *deadlock* dan membatalkan salah satunya.

**Solusi:**
Sebelum dieksekusi, array item selalu diurutkan secara deterministik berdasarkan `ticketTypeId`:

```typescript
const sortedItems = [...data.items].sort((a, b) =>
  a.ticketTypeId.localeCompare(b.ticketTypeId)
);
```

Dengan urutan kunci yang selalu seragam dari A ke Z, deadlock matematis mustahil terjadi.

---

## 4. Kedaluwarsa 15 menit dan pengembalian kuota

Pesanan menyimpan `expiresAt = now() + 15 menit`, dihitung menggunakan waktu server aplikasi yang tersinkron dengan database.

Kebenaran kedaluwarsa dijaga oleh **dua lapis**:

1. **Background Worker (`expireOverdueOrders`) tiap 30 detik:**
   - Mencari pesanan `PENDING_PAYMENT` dengan `expiresAt <= now()`.
   - Mengembalikan kuota secara atomik: `reservedCount = reservedCount - quantity`.
   - Mengubah status pesanan menjadi `EXPIRED`.
2. **Lazy Guard di Endpoint Bayar:**
   - Jika worker terlambat beberapa detik dan pembeli mencoba membayar di menit ke-16, transaksi pembayaran membaca `expiresAt` di bawah row lock.
   - Jika sudah lewat 15 menit, pembayaran langsung ditolak (status `409 / 410`), pesanan ditandai `EXPIRED`, dan kuota langsung dibalikkan saat itu juga.

**Kenapa tidak memakai `setTimeout` di memori Node.js:**
`setTimeout` hanya hidup di memori RAM. Jika container backend direstart, timer hilang dan kuota tertahan selamanya.

**Kenapa tidak memakai Redis / BullMQ:**
Penambahan Redis introducing infrastruktur baru dan kemungkinan *split-brain* antara Redis dan PostgreSQL. Pada skala ribuan transaksi lokal, database relational dengan indeks `(status, expiresAt)` sudah sanggup memproses kedaluwarsa dalam sub-milidetik.

---

## 5. Idempotensi pembayaran & Webhook

Proses pembayaran disimulasikan melalui dua jalur:
1. Endpoint langsung: `POST /api/orders/:id/pay` (untuk pengujian instan).
2. Endpoint Webhook: `POST /api/payments/webhook` (meniru provider sungguhan seperti Midtrans/Xendit).

Tiga lapis perlindungan idempotensi:

1. **Row Lock pada Pesanan:**
   Setiap transaksi pembayaran mengunci baris pesanan terlebih dahulu:
   ```sql
   SELECT * FROM "Order" WHERE id = $id FOR UPDATE;
   ```
   Dua request pembayaran simultan untuk pesanan yang sama akan antre. Request pertama berhasil mengubah status ke `PAID` dan menerbitkan tiket. Request kedua melihat status sudah `PAID`, sehingga langsung mengembalikan data tiket yang sudah ada tanpa menerbitkan tiket baru.

2. **Ledger Webhook (`WebhookEvent`):**
   Kolom `eventId` dari webhook disimpan dengan constraint `UNIQUE`. Jika provider mengirimkan webhook yang sama dua kali (*network retry*), insert duplikat akan terdeteksi. Sistem membalas `HTTP 200 OK` dengan payload tiket yang identik.

3. **Integritas Tiket Unik:**
   Tabel `Ticket` memiliki dua constraint penting:
   - `code UNIQUE`: Kode acak kriptografis 12 karakter (`GTX-` + random bytes hex).
   - `UNIQUE(orderItemId, seq)`: Sabuk pengaman fisik di database. Bahkan jika ada bug di mana fungsi penerbitan tiket terpanggil dua kali, satu item pesanan tidak akan pernah bisa menerbitkan tiket dobel.

**Tabel Perilaku Pengujian:**

| Skenario | Respons Sistem | Integritas Kuota & Tiket |
|---|---|---|
| Webhook dikirim 2x berturut-turut | 200 OK | Tiket sama, tidak ada duplikasi |
| Bayar 2x bersamaan (race condition) | 200 OK | Hanya 1 set tiket terbit |
| Webhook tiba setelah pesanan kedaluwarsa | 409 / 410 Ditolak | Tiket tidak terbit, kursi aman |
| Nominal pembayaran tidak cocok | 400 Bad Request | Pembayaran ditolak, event tidak dicatat |
| Pembatalan pesanan berulang kali | 200 / 409 Idempoten | Kuota hanya kembali tepat satu kali |

---

## 6. Uang dan integritas transaksi

1. **Snapshot Harga (`unitPrice`):**
   Tabel `OrderItem` menyimpan harga satuan saat pesanan dibuat. Jika admin mengubah harga tiket VIP dari Rp 750.000 menjadi Rp 1.000.000, pesanan yang dibuat kemarin tetap membayar Rp 750.000.
2. **Validasi Total Harga:**
   Backend menghitung ulang total harga secara independen dari database, bukan mempercayai nilai total yang dikirim oleh client/frontend.
3. **Verifikasi Webhook HMAC SHA-256:**
   Webhook memvalidasi signature HMAC SHA-256 yang dihitung dari `req.rawBody` menggunakan `crypto.timingSafeEqual` untuk mencegah *timing attacks*. Memakai raw body menjamin tanda tangan valid meski urutan key JSON berubah saat diparse.

---

## 7. Desain Frontend: Subtle Gothic Luxury

Frontend dibangun dengan React + Vite + Tailwind CSS yang disajikan lewat reverse proxy Nginx.

**Keputusan visual:**
- **Tema Gelap Total**: Memakai palet warna *Obsidian* (`#0D0B10`), *Charcoal* (`#19151D`), *Dusk Rose* (`#D9A5A0`), dan *Royal Plum* (`#392544`). Tidak ada warna putih/krem terang.
- **Tipografi Mandiri (Offline)**: Menggunakan `@fontsource/cinzel`, `@fontsource/cormorant-garamond`, dan `@fontsource/inter` yang di-bundle secara lokal. Aplikasi dapat dibuka tanpa koneksi internet.
- **Poster Kartu Tarot Neoklasik**: Menggabungkan foto pertunjukan panggung resolusi tinggi dengan vignette gelap dan ornamen mistis sudut bintang (`✦`).
- **Sinkronisasi Kuota Dinamis**: Tombol `+` pada pilihan tiket terikat langsung dengan sisa kuota kursi riil (`remaining = quota - reservedCount`) dan langsung mati (*disabled*) saat mencapai kapasitas maksimal event.

---

## 8. Strategi pengujian (Real PostgreSQL)

Seluruh test otomatis (`Vitest` + `Supertest`) dijalankan di atas **PostgreSQL sungguhan**, bukan mock memori. Pengujian konkurensi tidak ada artinya jika dijalankan di atas database mock yang tidak memiliki row-lock MVCC asli.

Hasil pengujian tercatat:
- **Test 1**: Alur pembelian lengkap dari reservasi $\rightarrow$ bayar $\rightarrow$ terbit tiket kode unik.
- **Test 2**: Kuota habis melempar HTTP 409, kuota tidak pernah bernilai negatif.
- **Test 3**: Kedaluwarsa 15 menit mengembalikan kuota dan menolak pembayaran susulan.
- **Test 4**: Pembatalan pesanan mengembalikan kuota secara idempoten.
- **Test 5**: Batas maksimal 4 tiket per event memblokir pesanan ke-5 dan menolak request paralel.
- **Test 6**: Idempotensi pembayaran menangani webhook ganda dan pembayaran paralel.
- **Test 7 (Uji Beban 200 Konkuren)**:
  - 200 permintaan paralel ditembakkan bersamaan untuk kuota 100 tiket.
  - Hasil nyata: **tepat 100 pesanan diterima (HTTP 201), tepat 100 pesanan ditolak (HTTP 409 Sold Out)**.
  - `reservedCount` akhir tepat 100, sisa kuota tepat 0, durasi di bawah 1 detik, **Zero Overselling**.
  - Bukti JSON tersimpan di `backend/tests/evidence/concurrency-result.json`.

---

## 9. Yang sengaja tidak dikerjakan

- **Microservices**: Kebutuhan sistem bersifat transaksional ketat. Monolith modular di dalam satu transaksi database lokal jauh lebih aman dari race condition dibanding sistem terdistribusi.
- **OAuth / Social Login Kompleks**: Sesuai instruksi tugas, autentikasi bukan inti penilaian. Sistem memakai JWT + bcrypt sederhana dengan Role `ADMIN` dan `BUYER`.
- **Integrasi Payment Gateway Asli**: Pembayaran disimulasikan lewat script dan webhook HMAC lokal agar dapat diuji secara mandiri tanpa kartu kredit atau akun sandbox pihak ketiga.

---

## Jawaban singkat untuk demo penguji

- **"Bagaimana sistem menjamin tiket tidak pernah oversell?"**  
  Pengurangan kuota dilakukan dengan satu query SQL atomik `WHERE reservedCount + qty <= quota` di bawah transaksi PostgreSQL. Ditambah pengaman `CHECK ("reservedCount" <= "quota")` di level database.
- **"Bagaimana jika 200 orang memesan di detik yang sama?"**  
  Tepat 100 pesanan pertama yang berhasil mengeksekusi atomic update akan diterima (201). 100 pesanan sisanya otomatis mendapat 0 baris terpengaruh dan langsung dibalas 409 Sold Out.
- **"Bagaimana batas 4 tiket dijaga saat request paralel?"**  
  Transaksi mengambil `pg_advisory_xact_lock(hashtext(userId:eventId))`. Dua request bersamaan dari pembeli yang sama dipaksa antre, sehingga transaksi kedua langsung membaca akumulasi tiket dan ditolak 422 jika melebihi batas.
- **"Bagaimana jika background worker kedaluwarsa mati?"**  
  Sistem tetap aman. Endpoint pembayaran memiliki *lazy check* yang memvalidasi `expiresAt <= now()`. Pesanan kedaluwarsa akan langsung ditolak dan kuotanya dikembalikan saat itu juga.
- **"Bagaimana jika webhook pembayaran dikirim dua kali?"**  
  Idempotensi dijaga oleh row lock pesanan, tabel `WebhookEvent` dengan `eventId` unik, dan constraint `UNIQUE(orderItemId, seq)` pada tiket. Webhook kedua dibalas 200 OK dengan tiket yang sama tanpa duplikasi.
