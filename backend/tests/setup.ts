import { prisma } from '../src/config/prisma';

export async function cleanDatabase() {
  await prisma.ticket.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.ticketType.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.webhookEvent.deleteMany({});
}
