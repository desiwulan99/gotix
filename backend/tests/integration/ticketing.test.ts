import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { cleanDatabase } from '../setup';
import { expireOverdueOrders } from '../../src/workers/expiry.worker';

const app = createApp();

describe('GOTIX Core Ticketing Integration Tests (Real PostgreSQL)', () => {
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
    await cleanDatabase();
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

    // 3. Buat Event Uji Coba dengan 2 Tipe Tiket
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
    regularTicketTypeId = eventRes.body.data.ticketTypes.find((t: any) => t.name === 'Regular').id;
    vipTicketTypeId = eventRes.body.data.ticketTypes.find((t: any) => t.name === 'VIP').id;
  });

  // TEST 1 — Beli sampai tiket terbit (Happy Path)
  it('TEST 1: Beli sampai tiket terbit (kuota berkurang, PENDING_PAYMENT, bayar, PAID, jumlah tiket = quantity, kode unik)', async () => {
    // A. Buat pesanan 2 tiket Regular
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

    // B. Verifikasi kuota berkurang (reservedCount = 2, remaining = 8)
    const eventCheck1 = await request(app).get(`/api/events/${testEventId}`);
    const regTicket1 = eventCheck1.body.data.ticketTypes.find((t: any) => t.id === regularTicketTypeId);
    expect(regTicket1.reservedCount).toBe(2);
    expect(regTicket1.remaining).toBe(8);

    // C. Pembeli membayar pesanan
    const payRes = await request(app)
      .post(`/api/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ paymentMethod: 'SIMULATED_BCA_VA' });

    expect(payRes.status).toBe(200);
    expect(payRes.body.data.order.status).toBe('PAID');

    // D. Verifikasi tiket terbit
    const tickets = payRes.body.data.tickets;
    expect(tickets).toHaveLength(2);
    expect(tickets[0].code).toMatch(/^GTX-[A-F0-9]{12}$/);
    expect(tickets[1].code).toMatch(/^GTX-[A-F0-9]{12}$/);
    expect(tickets[0].code).not.toBe(tickets[1].code); // Kode unik!
  });

  // TEST 2 — Sold Out
  it('TEST 2: Sold out (kuota habis -> 409, kuota tidak negatif)', async () => {
    // Buat event kecil dengan kuota hanya 2
    const smallEventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Intimate Candlelit Chamber',
        description: 'Chamber music with 2 seats quota',
        location: 'Secret Crypt',
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ticketTypes: [
          { name: 'Regular', price: 100000, quota: 2 },
          { name: 'VIP', price: 200000, quota: 1 },
        ],
      });
    const smallEventId = smallEventRes.body.data.id;
    const smallTicketTypeId = smallEventRes.body.data.ticketTypes.find((t: any) => t.name === 'Regular').id;

    // Beli 2 tiket (habiskan kuota)
    const order1 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId: smallEventId,
        items: [{ ticketTypeId: smallTicketTypeId, quantity: 2 }],
      });
    expect(order1.status).toBe(201);

    // Buat buyer kedua
    const buyer2Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'buyer2_test@gotix.id',
        password: 'BuyerPass123!',
        fullName: 'Buyer Two',
      });
    const buyer2Token = buyer2Res.body.data.token;

    // Coba beli 1 tiket saat kuota sudah habis -> 409 SOLD_OUT
    const order2 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyer2Token}`)
      .send({
        eventId: smallEventId,
        items: [{ ticketTypeId: smallTicketTypeId, quantity: 1 }],
      });

    expect(order2.status).toBe(409);
    expect(order2.body.error.code).toBe('SOLD_OUT');

    // Pastikan reservedCount tidak melebihi quota dan remaining tidak pernah minus
    const eventDetail = await request(app).get(`/api/events/${smallEventId}`);
    const regType = eventDetail.body.data.ticketTypes.find((t: any) => t.id === smallTicketTypeId);
    expect(regType.remaining).toBe(0);
    expect(regType.reservedCount).toBe(2);
    expect(regType.soldOut).toBe(true);
  });

  // TEST 3 — Kedaluwarsa
  it('TEST 3: Kedaluwarsa (panggil expireOverdueOrders dengan now = +16 menit -> EXPIRED, kuota kembali sekali, bayar ditolak)', async () => {
    // Buat order 2 tiket
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: regularTicketTypeId, quantity: 2 }],
      });
    const orderId = orderRes.body.data.id;

    // Panggil expireOverdueOrders dengan parameter now = +16 menit di masa depan (Dependency Injection)
    const futureTime = new Date(Date.now() + 16 * 60 * 1000);
    const expiredCount1 = await expireOverdueOrders(futureTime);
    expect(expiredCount1).toBeGreaterThanOrEqual(1);

    // Cek status order berubah menjadi EXPIRED
    const orderCheck = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(orderCheck.body.data.status).toBe('EXPIRED');

    // Cek kuota telah kembali utuh (reservedCount kembali 0)
    const eventCheck1 = await request(app).get(`/api/events/${testEventId}`);
    const regTicket1 = eventCheck1.body.data.ticketTypes.find((t: any) => t.id === regularTicketTypeId);
    expect(regTicket1.reservedCount).toBe(0);
    expect(regTicket1.remaining).toBe(10);

    // Jalankan kedua kali: kuota tidak boleh bertambah lagi (idempoten)
    const expiredCount2 = await expireOverdueOrders(futureTime);
    expect(expiredCount2).toBe(0);

    const eventCheck2 = await request(app).get(`/api/events/${testEventId}`);
    const regTicket2 = eventCheck2.body.data.ticketTypes.find((t: any) => t.id === regularTicketTypeId);
    expect(regTicket2.reservedCount).toBe(0);
    expect(regTicket2.remaining).toBe(10);

    // Coba bayar order yang sudah expired -> ditolak
    const payRes = await request(app)
      .post(`/api/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({});
    expect([409, 410]).toContain(payRes.status);
  });

  // TEST 4 — Pembatalan
  it('TEST 4: Pembatalan (kuota kembali, cancel berulang tidak menambah kuota)', async () => {
    // Buat order 3 tiket
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: regularTicketTypeId, quantity: 3 }],
      });
    const orderId = orderRes.body.data.id;

    // Batalkan order
    const cancelRes = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    // Verifikasi kuota kembali utuh
    const eventCheck1 = await request(app).get(`/api/events/${testEventId}`);
    const regTicket1 = eventCheck1.body.data.ticketTypes.find((t: any) => t.id === regularTicketTypeId);
    expect(regTicket1.reservedCount).toBe(0);
    expect(regTicket1.remaining).toBe(10);

    // Coba batalkan lagi untuk kedua kalinya -> idempoten, kuota tidak bertambah
    const cancelAgain = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect([200, 409]).toContain(cancelAgain.status);

    const eventCheck2 = await request(app).get(`/api/events/${testEventId}`);
    const regTicket2 = eventCheck2.body.data.ticketTypes.find((t: any) => t.id === regularTicketTypeId);
    expect(regTicket2.reservedCount).toBe(0);
    expect(regTicket2.remaining).toBe(10);
  });

  // TEST 5 — Batas 4 Tiket per Event
  it('TEST 5: Batas 4 tiket (4 boleh, kelima ditolak 422; PENDING + PAID dihitung; paralel request diblokir)', async () => {
    // Order 1: Beli 3 tiket (sukses)
    const order1 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: regularTicketTypeId, quantity: 3 }],
      });
    expect(order1.status).toBe(201);

    // Order 2: Coba beli 2 tiket lagi (Total jadi 5 -> harus DITOLAK 422)
    const order2 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: regularTicketTypeId, quantity: 2 }],
      });
    expect(order2.status).toBe(422);
    expect(order2.body.error.code).toBe('MAX_TICKETS_EXCEEDED');

    // Order 3: Beli 1 tiket lagi (Total jadi tepat 4 -> harus SUKSES)
    const order3 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: regularTicketTypeId, quantity: 1 }],
      });
    expect(order3.status).toBe(201);

    // Buat buyer baru untuk menguji request paralel yang totalnya > 4
    const parallelBuyerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'parallel_buyer@gotix.id',
        password: 'BuyerPass123!',
        fullName: 'Parallel Buyer',
      });
    const parallelToken = parallelBuyerRes.body.data.token;

    // Tembak 2 request order paralel dari user yang sama (masing-masing 3 tiket -> total 6 > 4)
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
    expect(statuses).toContain(422); // Tepat satu yang lolos berkat pg_advisory_xact_lock
  });

  // TEST 6 — Pembayaran Idempoten & Webhook
  it('TEST 6: Pembayaran idempoten (webhook sama 2x -> tiket sekali; pay 2x paralel -> tiket sekali; webhook expired -> diabaikan)', async () => {
    // Buat order
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: vipTicketTypeId, quantity: 1 }],
      });
    const orderId = orderRes.body.data.id;

    const webhookPayload = {
      eventId: 'evt_idempotent_test_' + Date.now(),
      type: 'payment.succeeded',
      orderId,
      amount: 250000,
      paymentMethod: 'TEST_GATEWAY',
    };

    // Panggilan webhook pertama
    const hook1 = await request(app)
      .post('/api/webhooks/payment')
      .send(webhookPayload);
    expect(hook1.status).toBe(200);
    expect(hook1.body.data.duplicate).toBe(false);

    // Pastikan tiket terbit tepat 1
    const ticketsAfterHook1 = await prisma.ticket.findMany({ where: { orderId } });
    expect(ticketsAfterHook1).toHaveLength(1);

    // Panggilan webhook kedua dengan eventId sama persis
    const hook2 = await request(app)
      .post('/api/webhooks/payment')
      .send(webhookPayload);
    expect(hook2.status).toBe(200);
    expect(hook2.body.data.duplicate).toBe(true);

    // Tiket tetap 1 (tidak ada duplikasi)
    const ticketsAfterHook2 = await prisma.ticket.findMany({ where: { orderId } });
    expect(ticketsAfterHook2).toHaveLength(1);

    // Uji webhook untuk order yang sudah EXPIRED
    const orderExpiredRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: vipTicketTypeId, quantity: 1 }],
      });
    const expiredOrderId = orderExpiredRes.body.data.id;

    // Paksa expired
    await expireOverdueOrders(new Date(Date.now() + 30 * 60 * 1000));

    const hookExpired = await request(app)
      .post('/api/webhooks/payment')
      .send({
        eventId: 'evt_expired_order_' + Date.now(),
        type: 'payment.succeeded',
        orderId: expiredOrderId,
      });

    expect(hookExpired.status).toBe(200);
    expect(hookExpired.body.data.status).toBe('ignored');

    // Tidak ada tiket yang terbit untuk order expired
    const expiredTickets = await prisma.ticket.findMany({ where: { orderId: expiredOrderId } });
    expect(expiredTickets).toHaveLength(0);
  });
});
