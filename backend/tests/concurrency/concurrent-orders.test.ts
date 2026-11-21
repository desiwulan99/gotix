import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { cleanDatabase } from '../setup';
import jwt from 'jsonwebtoken';
import { ENV } from '../../src/config/env';

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
        email: 'concurrency_admin@gotix.id',
        password: 'AdminPass123!',
        fullName: 'Concurrency Admin',
        role: 'ADMIN',
      });
    adminToken = adminRes.body.data.token;

    // 2. Buat Event dengan tepat 100 Kuota
    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'High-Demand Flash Sale Concert',
        description: 'Concurrency stress testing event with 100 tickets quota',
        location: 'Grand Obsidian Arena',
        startsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        ticketTypes: [
          { name: 'Regular', price: 100000, quota: 100 },
          { name: 'VIP', price: 500000, quota: 10 },
        ],
      });

    eventId = eventRes.body.data.id;
    ticketTypeId = eventRes.body.data.ticketTypes.find((t: any) => t.name === 'Regular').id;

    // 3. Buat 200 user berbeda secara batch untuk menyimulasikan 200 pembeli unik yang berebut tiket
    console.log('[CONCURRENCY TEST SETUP] Menyiapkan 200 user simultan...');
    const usersData = [];
    for (let i = 1; i <= 200; i++) {
      usersData.push({
        id: `00000000-0000-0000-0000-${i.toString().padStart(12, '0')}`,
        email: `buyer_${i}@gotix-stress.id`,
        passwordHash: 'dummy_hash_for_test',
        fullName: `Buyer ${i}`,
        role: 'BUYER' as const,
      });
    }

    await prisma.user.createMany({
      data: usersData,
      skipDuplicates: true,
    });

    for (const u of usersData) {
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

  it('TEST 7: Tepat 100 request berhasil (201), tepat 100 request gagal (409), reservedCount = 100, tidak ada negatif', async () => {
    console.log('[CONCURRENCY EXECUTION] Meluncurkan 200 request bersamaan...');
    const startTime = Date.now();

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
    const durationMs = Date.now() - startTime;

    let successCount = 0;
    let soldOutCount = 0;
    let otherCount = 0;

    for (const res of responses) {
      if (res.status === 201) {
        successCount++;
      } else if (res.status === 409) {
        soldOutCount++;
      } else {
        otherCount++;
      }
    }

    // Ambil data final dari database langsung
    const finalTicketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
    });

    const reservedCountFinal = finalTicketType?.reservedCount ?? -1;
    const quotaFinal = finalTicketType?.quota ?? -1;
    const remainingFinal = quotaFinal - reservedCountFinal;

    const summary = {
      testName: 'Concurrency 200 requests against 100 quota',
      timestamp: new Date().toISOString(),
      durationMs,
      totalRequests: 200,
      quotaInitial: 100,
      successCount,
      soldOutCount,
      otherCount,
      reservedCountFinal,
      remainingFinal,
      oversellingDetected: reservedCountFinal > 100,
      negativeStockDetected: remainingFinal < 0,
    };

    console.log('=====================================================');
    console.log('      CONCURRENCY STRESS TEST RESULT SUMMARY         ');
    console.log('=====================================================');
    console.log(`Total Requests      : ${summary.totalRequests}`);
    console.log(`Initial Quota       : ${summary.quotaInitial}`);
    console.log(`Success (201)       : ${summary.successCount}`);
    console.log(`Sold Out (409)      : ${summary.soldOutCount}`);
    console.log(`Other Statuses      : ${summary.otherCount}`);
    console.log(`Final ReservedCount : ${summary.reservedCountFinal}`);
    console.log(`Final Remaining     : ${summary.remainingFinal}`);
    console.log(`Execution Duration  : ${summary.durationMs}ms`);
    console.log(`Overselling Status  : ${summary.oversellingDetected ? 'FAIL (Overselling)' : 'PASSED (Zero Overselling)'}`);
    console.log('=====================================================');

    // Tulis bukti ke backend/tests/evidence/concurrency-result.json
    const evidenceDir = path.resolve(__dirname, '../evidence');
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true });
    }
    const evidencePath = path.join(evidenceDir, 'concurrency-result.json');
    fs.writeFileSync(evidencePath, JSON.stringify(summary, null, 2), 'utf-8');
    console.log(`[CONCURRENCY TEST] Bukti hasil ditulis ke: ${evidencePath}`);

    // Asersi ketat sesuai spesifikasi
    expect(successCount).toBe(100);
    expect(soldOutCount).toBe(100);
    expect(otherCount).toBe(0);
    expect(reservedCountFinal).toBe(100);
    expect(remainingFinal).toBe(0);
  });
});
