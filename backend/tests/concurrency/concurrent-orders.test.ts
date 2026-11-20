import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { cleanDatabase } from '../setup';

const app = createApp();

describe('CONCURRENCY STRESS TEST — 200 Requests for 100 Quota', () => {
  let adminToken: string;
  let eventId: string;
  let ticketTypeId: string;
  const userTokens: string[] = [];

  beforeAll(async () => {
    await prisma.$connect();
    await cleanDatabase();

    // 1. Buat Admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'concurrency_admin@gotix.com',
        password: 'password123',
        fullName: 'Stress Test Admin',
        role: 'ADMIN',
      });
    adminToken = adminRes.body.data.token;

    // 2. Buat Event dengan tepat 100 Kuota
    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'High-Demand Flash Sale Concert',
        description: 'Concurrency stress testing event with 100 tickets',
        location: 'Grand Obsidian Arena',
        eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        ticketTypes: [
          { name: 'Regular', price: 100000, totalQuota: 100 },
          { name: 'VIP', price: 500000, totalQuota: 10 },
        ],
      });

    eventId = eventRes.body.data.id;
    ticketTypeId = eventRes.body.data.ticketTypes.find((t: any) => t.name === 'Regular').id;

    // 3. Buat 200 user berbeda untuk menyimulasikan 200 pembeli unik yang berebut tiket
    console.log('[CONCURRENCY TEST SETUP] Menyiapkan 200 user simultan...');
    const userCreationPromises = [];
    for (let i = 1; i <= 200; i++) {
      userCreationPromises.push(
        prisma.user.create({
          data: {
            email: `buyer_${i}@gotix-stress.com`,
            passwordHash: 'dummyhash',
            fullName: `Buyer ${i}`,
            role: 'CUSTOMER',
          },
        })
      );
    }
    const createdUsers = await Promise.all(userCreationPromises);

    // Generate JWT token untuk masing-masing 200 user
    const jwt = (await import('jsonwebtoken')).default;
    const { ENV } = await import('../../src/config/env');
    for (const u of createdUsers) {
      const token = jwt.sign(
        { id: u.id, email: u.email, role: u.role },
        ENV.JWT_SECRET,
        { expiresIn: '1h' }
      );
      userTokens.push(token);
    }
    console.log('[CONCURRENCY TEST SETUP] 200 user siap menembakkan request.');
  }, 60000);

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it('TEST 7: Tepat 100 request berhasil (201), tepat 100 request gagal (400), tidak terjadi overselling', async () => {
    console.log('[CONCURRENCY EXECUTION] Meluncurkan 200 request bersamaan...');

    // Luncurkan 200 request pembelian tiket secara bersamaan menggunakan Promise.all
    const requests = userTokens.map((token) => {
      return request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          eventId,
          items: [{ ticketTypeId, quantity: 1 }],
        });
    });

    const responses = await Promise.all(requests);

    let successCount = 0;
    let failedCount = 0;

    for (const res of responses) {
      if (res.status === 201) {
        successCount++;
      } else if (res.status === 400) {
        failedCount++;
      }
    }

    console.log(`[CONCURRENCY RESULTS]`);
    console.log(` - Sukses (201 Created)     : ${successCount}`);
    console.log(` - Gagal  (400 Bad Request) : ${failedCount}`);
    console.log(` - Total Request Dikirim    : ${responses.length}`);

    // Verifikasi Ketat Kriteria Penilaian:
    // 1. Tepat 100 sukses
    expect(successCount).toBe(100);

    // 2. Tepat 100 gagal karena kehabisan kuota
    expect(failedCount).toBe(100);

    // 3. Periksa kondisi database secara langsung
    const ticketTypeInDb = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
    });

    expect(ticketTypeInDb).not.toBeNull();
    expect(ticketTypeInDb!.totalQuota).toBe(100);
    expect(ticketTypeInDb!.reservedQuota).toBe(100);
    expect(ticketTypeInDb!.paidQuota).toBe(0);

    // 4. Kuota sisa harus tepat 0 (TIDAK BOLEH NEGATIF / OVERSELLING)
    const availableQuota =
      ticketTypeInDb!.totalQuota -
      (ticketTypeInDb!.reservedQuota + ticketTypeInDb!.paidQuota);
    expect(availableQuota).toBe(0);

    // 5. Total order berstatus PENDING_PAYMENT di database harus tepat 100
    const totalOrdersInDb = await prisma.order.count({
      where: { eventId, status: 'PENDING_PAYMENT' },
    });
    expect(totalOrdersInDb).toBe(100);
  }, 120000);
});
