import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { cleanDatabase, restoreSeedData } from '../setup';
import { expireOverdueOrders } from '../../src/workers/expiry.worker';

const app = createApp();

describe('GOTIX Core Business Requirements Integration Tests (Real PostgreSQL)', () => {
  let buyerToken: string;
  let buyerId: string;
  let adminToken: string;
  let testEventId: string;
  let regularTicketTypeId: string;
  let vipTicketTypeId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await restoreSeedData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // 1. Buat User Buyer
    const buyerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'buyer_test@gotix.id',
        password: 'BuyerPass123!',
        fullName: 'Test Buyer',
        role: 'BUYER',
      });
    buyerToken = buyerRes.body.data.token;
    buyerId = buyerRes.body.data.user.id;

    // 2. Buat User Admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin_test@gotix.id',
        password: 'AdminPass123!',
        fullName: 'Test Admin',
        role: 'ADMIN',
      });
    adminToken = adminRes.body.data.token;

    // 3. Buat Event Uji Coba Default dengan 2 Tipe Tiket (Regular & VIP)
    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Dark Solstice Gala',
        description: 'Exclusive Gothic Luxury Gala for testing',
        location: 'Obsidian Citadel',
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ticketTypes: [
          { name: 'Regular', price: 100000, quota: 10 },
          { name: 'VIP', price: 250000, quota: 5 },
        ],
      });

    testEventId = eventRes.body.data.id;
    regularTicketTypeId = eventRes.body.data.ticketTypes.find((t: { name: string; id: string }) => t.name === 'Regular').id;
    vipTicketTypeId = eventRes.body.data.ticketTypes.find((t: { name: string; id: string }) => t.name === 'VIP').id;
  });

  // ============================================================================
  // KEBUTUHAN BISNIS 1
  // Penyelenggara membuat event dengan kuota tiket terbatas, misalnya 100.
  // Event punya dua tipe tiket (Reguler, VIP), masing-masing dengan kuota dan harga sendiri.
  // ============================================================================
  it('Kebutuhan Bisnis 1: Penyelenggara membuat event dengan kuota tiket terbatas (100) dan dua tipe tiket (Reguler, VIP) dengan kuota dan harga masing-masing', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Grand Opera of Shadows',
        description: 'Pentas opera neoklasik dengan alokasi kuota 100 kursi',
        location: 'Teater Katedral Gelap, Jakarta',
        startsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        ticketTypes: [
          { name: 'Reguler', price: 150000, quota: 80 },
          { name: 'VIP', price: 500000, quota: 20 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Grand Opera of Shadows');
    expect(res.body.data.ticketTypes).toHaveLength(2);

    const reguler = res.body.data.ticketTypes.find((t: { name: string }) => t.name === 'Reguler');
    const vip = res.body.data.ticketTypes.find((t: { name: string }) => t.name === 'VIP');

    expect(reguler).toBeDefined();
    expect(Number(reguler.price)).toBe(150000);
    expect(reguler.quota).toBe(80);
    expect(reguler.reservedCount).toBe(0);

    expect(vip).toBeDefined();
    expect(Number(vip.price)).toBe(500000);
    expect(vip.quota).toBe(20);
    expect(vip.reservedCount).toBe(0);

    // Verifikasi detail event yang baru dibuat memiliki remaining yang benar
    const detailRes = await request(app).get(`/api/events/${res.body.data.id}`);
    const regDetail = detailRes.body.data.ticketTypes.find((t: { name: string }) => t.name === 'Reguler');
    expect(regDetail.remaining).toBe(80);
    expect(regDetail.soldOut).toBe(false);
  });

  // ============================================================================
  // KEBUTUHAN BISNIS 2
  // Pembeli bisa melihat event dan sisa kuota tiap tipe.
  // ============================================================================
  it('Kebutuhan Bisnis 2: Pembeli bisa melihat event dan sisa kuota tiap tipe secara akurat', async () => {
    // A. Pembeli melihat daftar event
    const listRes = await request(app).get('/api/events');
    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.some((e: { id: string }) => e.id === testEventId)).toBe(true);

    // B. Pembeli melihat detail event beserta sisa kuota tiap tipe tiket
    const detailRes = await request(app).get(`/api/events/${testEventId}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.id).toBe(testEventId);
    expect(detailRes.body.data.ticketTypes).toHaveLength(2);

    const reg = detailRes.body.data.ticketTypes.find((t: { id: string }) => t.id === regularTicketTypeId);
    expect(reg.name).toBe('Regular');
    expect(reg.quota).toBe(10);
    expect(reg.reservedCount).toBe(0);
    expect(reg.remaining).toBe(10);
    expect(reg.soldOut).toBe(false);
  });

  // ============================================================================
  // KEBUTUHAN BISNIS 3
  // Pembeli memesan 1-4 tiket. Pesanan berstatus "menunggu bayar" dan menahan kuota selama 15 menit.
  // Lewat 15 menit tanpa bayar, pesanan batal dan kuota kembali.
  // ============================================================================
  it('Kebutuhan Bisnis 3: Pembeli memesan 1-4 tiket, status PENDING_PAYMENT menahan kuota 15 menit, lewat 15 menit batal dan kuota kembali', async () => {
    // A. Pembeli memesan 2 tiket Regular
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: regularTicketTypeId, quantity: 2 }],
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.data.status).toBe('PENDING_PAYMENT');
    const orderId = orderRes.body.data.id;

    // Verifikasi expiresAt terkonfigurasi sekitar 15 menit ke depan (antara 14 dan 16 menit)
    const expiresAt = new Date(orderRes.body.data.expiresAt).getTime();
    const now = Date.now();
    const diffMinutes = (expiresAt - now) / (60 * 1000);
    expect(diffMinutes).toBeGreaterThanOrEqual(14);
    expect(diffMinutes).toBeLessThanOrEqual(16);

    // B. Verifikasi kuota ditahan (reservedCount = 2, remaining = 8)
    const eventCheck1 = await request(app).get(`/api/events/${testEventId}`);
    const reg1 = eventCheck1.body.data.ticketTypes.find((t: { id: string }) => t.id === regularTicketTypeId);
    expect(reg1.reservedCount).toBe(2);
    expect(reg1.remaining).toBe(8);

    // C. Simulasi waktu lewat 15 menit (now = +16 menit di masa depan)
    const futureTime = new Date(Date.now() + 16 * 60 * 1000);
    const expiredCount = await expireOverdueOrders(futureTime);
    expect(expiredCount).toBeGreaterThanOrEqual(1);

    // D. Verifikasi status pesanan berubah menjadi EXPIRED
    const orderCheck = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(orderCheck.body.data.status).toBe('EXPIRED');

    // E. Verifikasi kuota kembali utuh (reservedCount = 0, remaining = 10)
    const eventCheck2 = await request(app).get(`/api/events/${testEventId}`);
    const reg2 = eventCheck2.body.data.ticketTypes.find((t: { id: string }) => t.id === regularTicketTypeId);
    expect(reg2.reservedCount).toBe(0);
    expect(reg2.remaining).toBe(10);

    // F. Pembayaran pada pesanan expired harus ditolak
    const payRes = await request(app)
      .post(`/api/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({});
    expect([409, 410]).toContain(payRes.status);
  });

  // ============================================================================
  // KEBUTUHAN BISNIS 4
  // Satu pembeli maksimal 4 tiket per event, dihitung dari semua pesanan yang masih aktif atau sudah dibayar.
  // ============================================================================
  it('Kebutuhan Bisnis 4: Satu pembeli maksimal 4 tiket per event, dihitung dari semua pesanan aktif (PENDING_PAYMENT) atau sudah dibayar (PAID)', async () => {
    // Order 1: Pesan 3 tiket (Sukses -> 3 tiket aktif)
    const order1 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: regularTicketTypeId, quantity: 3 }],
      });
    expect(order1.status).toBe(201);

    // Order 2: Coba pesan 2 tiket lagi (Total jadi 5 -> harus DITOLAK 422)
    const order2 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: regularTicketTypeId, quantity: 2 }],
      });
    expect(order2.status).toBe(422);
    expect(order2.body.error.code).toBe('MAX_TICKETS_EXCEEDED');

    // Order 3: Pesan 1 tiket lagi (Total tepat 4 tiket aktif -> harus SUKSES 201)
    const order3 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: regularTicketTypeId, quantity: 1 }],
      });
    expect(order3.status).toBe(201);

    // Order 4: Coba pesan 1 tiket lagi saat sudah memegang 4 tiket aktif -> DITOLAK 422
    const order4 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: regularTicketTypeId, quantity: 1 }],
      });
    expect(order4.status).toBe(422);
    expect(order4.body.error.code).toBe('MAX_TICKETS_EXCEEDED');

    // Bayar salah satu order (Order 3: 1 tiket), status berubah jadi PAID
    await request(app)
      .post(`/api/orders/${order3.body.data.id}/pay`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ paymentMethod: 'SIMULATED_BCA_VA' });

    // Order 5: Setelah order 3 dibayar, total tiket aktif (1 PAID + 3 PENDING = 4) tetap 4!
    // Pemesanan tambahan tiket ke-5 tetap harus DITOLAK 422
    const order5 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: vipTicketTypeId, quantity: 1 }],
      });
    expect(order5.status).toBe(422);
    expect(order5.body.error.code).toBe('MAX_TICKETS_EXCEEDED');

    // Uji proteksi konkurensi (PostgreSQL Advisory Lock):
    // Buat buyer baru dan tembak 2 order paralel masing-masing 3 tiket (total 6 > 4)
    const parallelBuyerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'parallel_buyer_2@gotix.id',
        password: 'BuyerPass123!',
        fullName: 'Parallel Buyer 2',
      });
    const parallelToken = parallelBuyerRes.body.data.token;

    const [parallelOrderA, parallelOrderB] = await Promise.all([
      request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${parallelToken}`)
        .send({
          eventId: testEventId,
          items: [{ ticketTypeId: vipTicketTypeId, quantity: 3 }],
        }),
      request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${parallelToken}`)
        .send({
          eventId: testEventId,
          items: [{ ticketTypeId: vipTicketTypeId, quantity: 3 }],
        }),
    ]);

    const statuses = [parallelOrderA.status, parallelOrderB.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(422); // Tepat satu request yang lolos, lainnya ditolak!
  });

  // ============================================================================
  // KEBUTUHAN BISNIS 5
  // Pembeli bisa membatalkan pesanan sebelum bayar. Kuota langsung kembali.
  // ============================================================================
  it('Kebutuhan Bisnis 5: Pembeli bisa membatalkan pesanan sebelum bayar, kuota tiket langsung kembali secara instan', async () => {
    // A. Pembeli memesan 3 tiket
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: regularTicketTypeId, quantity: 3 }],
      });
    expect(orderRes.status).toBe(201);
    const orderId = orderRes.body.data.id;

    // Verifikasi kuota terpotong 3
    const checkBefore = await request(app).get(`/api/events/${testEventId}`);
    const regBefore = checkBefore.body.data.ticketTypes.find((t: { id: string }) => t.id === regularTicketTypeId);
    expect(regBefore.reservedCount).toBe(3);
    expect(regBefore.remaining).toBe(7);

    // B. Pembeli membatalkan pesanan
    const cancelRes = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    // C. Verifikasi kuota langsung kembali utuh (reservedCount = 0, remaining = 10)
    const checkAfter = await request(app).get(`/api/events/${testEventId}`);
    const regAfter = checkAfter.body.data.ticketTypes.find((t: { id: string }) => t.id === regularTicketTypeId);
    expect(regAfter.reservedCount).toBe(0);
    expect(regAfter.remaining).toBe(10);

    // D. Pembatalan berulang bersifat idempoten dan tidak menambah kuota
    const cancelAgain = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect([200, 409]).toContain(cancelAgain.status);

    const checkFinal = await request(app).get(`/api/events/${testEventId}`);
    const regFinal = checkFinal.body.data.ticketTypes.find((t: { id: string }) => t.id === regularTicketTypeId);
    expect(regFinal.reservedCount).toBe(0);
    expect(regFinal.remaining).toBe(10);
  });

  // ============================================================================
  // KEBUTUHAN BISNIS 6
  // Pembayaran disimulasikan: kalian menyediakan cara menandai pesanan sebagai lunas (endpoint atau skrip).
  // ============================================================================
  it('Kebutuhan Bisnis 6: Pembayaran disimulasikan (endpoint bayar dan webhook) untuk menandai pesanan lunas', async () => {
    // A. Simulasi melalui Endpoint Bayar Langsung (/api/orders/:id/pay)
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: regularTicketTypeId, quantity: 2 }],
      });
    const orderId = orderRes.body.data.id;

    const payRes = await request(app)
      .post(`/api/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ paymentMethod: 'SIMULATED_BCA_VA' });

    expect(payRes.status).toBe(200);
    expect(payRes.body.success).toBe(true);
    expect(payRes.body.data.order.status).toBe('PAID');

    // B. Simulasi melalui Webhook Payment Provider (/api/webhooks/payment)
    const orderWebhookRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: vipTicketTypeId, quantity: 1 }],
      });
    const webhookOrderId = orderWebhookRes.body.data.id;

    const webhookRes = await request(app)
      .post('/api/webhooks/payment')
      .send({
        eventId: 'simulated_evt_' + Date.now(),
        type: 'payment.succeeded',
        orderId: webhookOrderId,
        amount: 250000,
        paymentMethod: 'QRIS_SIMULATED',
      });

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.data.status).toBe('success');

    const webhookOrderCheck = await request(app)
      .get(`/api/orders/${webhookOrderId}`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(webhookOrderCheck.body.data.status).toBe('PAID');
  });

  // ============================================================================
  // KEBUTUHAN BISNIS 7
  // Pembayaran berhasil menerbitkan tiket dengan kode unik. Satu pesanan tidak boleh menerbitkan tiket dua kali.
  // ============================================================================
  it('Kebutuhan Bisnis 7: Pembayaran berhasil menerbitkan tiket dengan kode unik, satu pesanan tidak boleh menerbitkan tiket dua kali (idempoten)', async () => {
    // A. Buat pesanan 2 tiket VIP
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: vipTicketTypeId, quantity: 2 }],
      });
    const orderId = orderRes.body.data.id;

    // B. Bayar pesanan pertama kali
    const payRes = await request(app)
      .post(`/api/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ paymentMethod: 'SIMULATED_MANDIRI' });

    expect(payRes.status).toBe(200);
    const tickets = payRes.body.data.tickets;
    expect(tickets).toHaveLength(2);

    // Verifikasi kode tiket unik sesuai format GTX-...
    expect(tickets[0].code).toMatch(/^GTX-[A-F0-9]{12}$/);
    expect(tickets[1].code).toMatch(/^GTX-[A-F0-9]{12}$/);
    expect(tickets[0].code).not.toBe(tickets[1].code);

    // C. Coba bayar ulang pesanan yang sudah PAID (Idempotensi: tiket tidak boleh terbit dua kali)
    // Endpoint pay menolak pembayaran ulang dengan 409 Conflict
    const payAgainRes = await request(app)
      .post(`/api/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ paymentMethod: 'SIMULATED_MANDIRI' });

    expect(payAgainRes.status).toBe(409);

    // D. Uji Webhook Idempotency: Webhook kedua dengan eventId sama tidak menerbitkan tiket ganda
    const webhookPayload = {
      eventId: 'evt_idempotent_test_' + Date.now(),
      type: 'payment.succeeded',
      orderId,
    };
    const hookDupRes = await request(app)
      .post('/api/webhooks/payment')
      .send(webhookPayload);
    expect(hookDupRes.status).toBe(200);
    expect(hookDupRes.body.data.duplicate).toBe(false);

    // Kirim lagi eventId yang sama
    const hookDup2Res = await request(app)
      .post('/api/webhooks/payment')
      .send(webhookPayload);
    expect(hookDup2Res.status).toBe(200);
    expect(hookDup2Res.body.data.duplicate).toBe(true);

    // Verifikasi di database: jumlah tiket tetap tepat 2 (tidak pernah menjadi 4)
    const dbTickets = await prisma.ticket.findMany({ where: { orderId } });
    expect(dbTickets).toHaveLength(2);
  });

  // ============================================================================
  // KEBUTUHAN BISNIS 8
  // Pembeli bisa melihat riwayat pesanan dan tiketnya.
  // ============================================================================
  it('Kebutuhan Bisnis 8: Pembeli bisa melihat riwayat pesanan (GET /api/orders) dan tiketnya (GET /api/tickets)', async () => {
    // A. Buat pesanan dan bayar
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: regularTicketTypeId, quantity: 2 }],
      });
    const orderId = orderRes.body.data.id;

    await request(app)
      .post(`/api/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ paymentMethod: 'SIMULATED_BCA' });

    // B. Pembeli melihat riwayat pesanan miliknya (GET /api/orders)
    const ordersHistoryRes = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(ordersHistoryRes.status).toBe(200);
    expect(ordersHistoryRes.body.success).toBe(true);
    expect(Array.isArray(ordersHistoryRes.body.data)).toBe(true);
    expect(ordersHistoryRes.body.data.length).toBeGreaterThanOrEqual(1);

    const matchedOrder = ordersHistoryRes.body.data.find((o: { id: string }) => o.id === orderId);
    expect(matchedOrder).toBeDefined();
    expect(matchedOrder.status).toBe('PAID');
    expect(matchedOrder.items).toHaveLength(1);
    expect(matchedOrder.items[0].quantity).toBe(2);

    // C. Pembeli melihat daftar tiket miliknya (GET /api/tickets)
    const ticketsRes = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(ticketsRes.status).toBe(200);
    expect(ticketsRes.body.success).toBe(true);
    expect(Array.isArray(ticketsRes.body.data)).toBe(true);
    expect(ticketsRes.body.data.length).toBeGreaterThanOrEqual(2);

    const userTicketCodes = ticketsRes.body.data.map((t: { code: string }) => t.code);
    expect(userTicketCodes.every((code: string) => code.startsWith('GTX-'))).toBe(true);
  });
});
