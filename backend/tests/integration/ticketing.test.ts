import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { cleanDatabase } from '../setup';
import { runExpiryCheck } from '../../src/workers/expiry.worker';

const app = createApp();

describe('GOTIX Core Ticketing Integration Tests', () => {
  let customerToken: string;
  let customerId: string;
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

    // 1. Buat User Customer
    const custRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'tester@gotix.com',
        password: 'password123',
        fullName: 'Test Customer',
        role: 'CUSTOMER',
      });
    customerToken = custRes.body.data.token;
    customerId = custRes.body.data.user.id;

    // 2. Buat User Admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@gotix.com',
        password: 'password123',
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
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ticketTypes: [
          { name: 'Regular', price: 100000, totalQuota: 10 },
          { name: 'VIP', price: 250000, totalQuota: 5 },
        ],
      });

    testEventId = eventRes.body.data.id;
    regularTicketTypeId = eventRes.body.data.ticketTypes.find((t: any) => t.name === 'Regular').id;
    vipTicketTypeId = eventRes.body.data.ticketTypes.find((t: any) => t.name === 'VIP').id;
  });

  // TEST 1 — Purchase to Ticket (Happy Path)
  it('TEST 1: User membuat order -> kuota berkurang -> bayar -> order PAID & tiket unik terbit', async () => {
    // A. Buat pesanan 2 tiket Regular
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: regularTicketTypeId, quantity: 2 }],
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.data.status).toBe('PENDING_PAYMENT');
    const orderId = orderRes.body.data.id;

    // B. Verifikasi kuota berkurang (reservedQuota = 2)
    const eventCheck1 = await request(app).get(`/api/events/${testEventId}`);
    const regTicket1 = eventCheck1.body.data.ticketTypes.find((t: any) => t.id === regularTicketTypeId);
    expect(regTicket1.reservedQuota).toBe(2);
    expect(regTicket1.remainingQuota).toBe(8);

    // C. Pembeli membayar pesanan
    const payRes = await request(app)
      .post(`/api/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ paymentMethod: 'SIMULATED_BCA_VA' });

    expect(payRes.status).toBe(200);
    expect(payRes.body.data.status).toBe('PAID');

    // D. Verifikasi tiket terbit
    const tickets = payRes.body.data.tickets;
    expect(tickets).toHaveLength(2);
    expect(tickets[0].ticketCode).toMatch(/^GTX-[A-F0-9]{4}-[A-F0-9]{4}$/);
    expect(tickets[1].ticketCode).toMatch(/^GTX-[A-F0-9]{4}-[A-F0-9]{4}$/);
    expect(tickets[0].ticketCode).not.toBe(tickets[1].ticketCode); // Kode harus unik!

    // E. Verifikasi kuota pindah dari reserved ke paid
    const eventCheck2 = await request(app).get(`/api/events/${testEventId}`);
    const regTicket2 = eventCheck2.body.data.ticketTypes.find((t: any) => t.id === regularTicketTypeId);
    expect(regTicket2.reservedQuota).toBe(0);
    expect(regTicket2.paidQuota).toBe(2);
    expect(regTicket2.remainingQuota).toBe(8);
  });

  // TEST 2 — Sold Out
  it('TEST 2: Kuota habis menolak pembelian berikutnya dan tidak terjadi kuota negatif', async () => {
    // Event baru dengan kuota hanya 2
    const smallEventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Intimate Candlelit Chamber',
        description: 'Chamber music with 2 seats quota',
        location: 'Secret Crypt',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ticketTypes: [
          { name: 'Regular', price: 100000, totalQuota: 2 },
          { name: 'VIP', price: 200000, totalQuota: 1 },
        ],
      });
    const smallEventId = smallEventRes.body.data.id;
    const smallTicketTypeId = smallEventRes.body.data.ticketTypes.find((t: any) => t.name === 'Regular').id;

    // Beli 2 tiket (habiskan kuota)
    const order1 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        eventId: smallEventId,
        items: [{ ticketTypeId: smallTicketTypeId, quantity: 2 }],
      });
    expect(order1.status).toBe(201);

    // Buat customer kedua
    const cust2Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'tester2@gotix.com',
        password: 'password123',
        fullName: 'Customer Two',
      });
    const customer2Token = cust2Res.body.data.token;

    // Coba beli 1 tiket lagi saat kuota sudah habis
    const order2 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({
        eventId: smallEventId,
        items: [{ ticketTypeId: smallTicketTypeId, quantity: 1 }],
      });

    expect(order2.status).toBe(400);
    expect(order2.body.message).toMatch(/tidak mencukupi/i);

    // Pastikan remaining quota tidak pernah minus
    const eventDetail = await request(app).get(`/api/events/${smallEventId}`);
    const regType = eventDetail.body.data.ticketTypes.find((t: any) => t.id === smallTicketTypeId);
    expect(regType.remainingQuota).toBe(0);
  });

  // TEST 3 — Order Expiration
  it('TEST 3: Pesanan melewati batas waktu -> EXPIRED -> kuota kembali -> tidak dapat dibayar', async () => {
    // Buat order
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: regularTicketTypeId, quantity: 2 }],
      });
    const orderId = orderRes.body.data.id;

    // Simulasikan waktu melewati batas (mundurkan expiresAt di database ke masa lalu)
    await prisma.order.update({
      where: { id: orderId },
      data: { expiresAt: new Date(Date.now() - 60 * 1000) }, // 1 menit yang lalu
    });

    // Jalankan worker expiry
    const processed = await runExpiryCheck();
    expect(processed).toBeGreaterThanOrEqual(1);

    // Cek status order berubah menjadi EXPIRED
    const orderCheck = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(orderCheck.body.data.status).toBe('EXPIRED');

    // Cek kuota telah kembali utuh
    const eventCheck = await request(app).get(`/api/events/${testEventId}`);
    const regTicket = eventCheck.body.data.ticketTypes.find((t: any) => t.id === regularTicketTypeId);
    expect(regTicket.reservedQuota).toBe(0);
    expect(regTicket.remainingQuota).toBe(10);

    // Coba bayar order yang sudah expired -> wajib ditolak
    const payRes = await request(app)
      .post(`/api/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({});
    expect(payRes.status).toBe(400);
    expect(payRes.body.message).toMatch(/kedaluwarsa/i);
  });

  // TEST 4 — Cancellation
  it('TEST 4: Pembeli membatalkan order -> kuota kembali -> pembatalan ulang tidak menambah kuota', async () => {
    // Buat order 3 tiket
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: regularTicketTypeId, quantity: 3 }],
      });
    const orderId = orderRes.body.data.id;

    // Batalkan order
    const cancelRes = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    // Verifikasi kuota kembali utuh
    const eventCheck1 = await request(app).get(`/api/events/${testEventId}`);
    const regTicket1 = eventCheck1.body.data.ticketTypes.find((t: any) => t.id === regularTicketTypeId);
    expect(regTicket1.reservedQuota).toBe(0);
    expect(regTicket1.remainingQuota).toBe(10);

    // Coba batalkan lagi untuk kedua kalinya -> harus ditolak & kuota tidak boleh bertambah lagi!
    const cancelAgain = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(cancelAgain.status).toBe(400);

    const eventCheck2 = await request(app).get(`/api/events/${testEventId}`);
    const regTicket2 = eventCheck2.body.data.ticketTypes.find((t: any) => t.id === regularTicketTypeId);
    expect(regTicket2.remainingQuota).toBe(10);
  });

  // TEST 5 — Maximum Ticket Limit (Maksimal 4 Tiket per Event)
  it('TEST 5: User dibatasi maksimal 4 tiket per event, request melebihi 4 ditolak', async () => {
    // Order 1: Beli 3 tiket (sukses)
    const order1 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: regularTicketTypeId, quantity: 3 }],
      });
    expect(order1.status).toBe(201);

    // Order 2: Coba beli 2 tiket lagi (Total jadi 5 -> harus DITOLAK)
    const order2 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: regularTicketTypeId, quantity: 2 }],
      });
    expect(order2.status).toBe(400);
    expect(order2.body.message).toMatch(/melebihi batas/i);

    // Order 3: Beli 1 tiket lagi (Total jadi 4 -> harus SUKSES)
    const order3 = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: regularTicketTypeId, quantity: 1 }],
      });
    expect(order3.status).toBe(201);
  });

  // TEST 6 — Idempotent Payment & Webhook
  it('TEST 6: Webhook pembayaran dikirim dua kali dengan eventId sama hanya memproses 1 kali', async () => {
    // Buat order
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        eventId: testEventId,
        items: [{ ticketTypeId: vipTicketTypeId, quantity: 1 }],
      });
    const orderId = orderRes.body.data.id;

    const webhookPayload = {
      eventId: 'evt_pay_simulation_unique_998877',
      orderId,
      amount: 250000,
      paymentStatus: 'SUCCESS' as const,
      paymentMethod: 'PAYMENT_GATEWAY_WEBHOOK',
    };

    // Panggilan webhook pertama
    const hook1 = await request(app)
      .post('/api/webhooks/payment')
      .send(webhookPayload);
    expect(hook1.status).toBe(200);
    expect(hook1.body.data.idempotent).toBe(false);

    // Pastikan tiket terbit
    const tickets = await prisma.ticket.findMany({ where: { orderId } });
    expect(tickets).toHaveLength(1);

    // Panggilan webhook kedua dengan payload & eventId yang SAMA PERSIS
    const hook2 = await request(app)
      .post('/api/webhooks/payment')
      .send(webhookPayload);
    expect(hook2.status).toBe(200);
    expect(hook2.body.data.idempotent).toBe(true);

    // Pastikan TIDAK ADA tiket ganda yang terbit
    const ticketsAfter = await prisma.ticket.findMany({ where: { orderId } });
    expect(ticketsAfter).toHaveLength(1);
  });
});
