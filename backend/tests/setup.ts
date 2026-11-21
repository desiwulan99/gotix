import { prisma } from '../src/config/prisma';
import { execSync } from 'child_process';
import path from 'path';

export async function cleanDatabase() {
  try {
    await prisma.$executeRawUnsafe(`
      TRUNCATE "Ticket", "Payment", "OrderItem", "Order", "TicketType", "Event", "User", "WebhookEvent" CASCADE;
    `);
  } catch (_e) {
    // Fallback deleteMany jika truncate terkendala
    await prisma.ticket.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.ticketType.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.webhookEvent.deleteMany({});
  }
}

export async function restoreSeedData() {
  try {
    const { seed } = require('../prisma/seed.js');
    await seed();
  } catch (err) {
    console.error('[TEST TEARDOWN] Gagal me-restore seed data:', err);
  }
}
