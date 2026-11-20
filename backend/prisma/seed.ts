import { PrismaClient, Role, EventStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Memulai proses seeding database GOTIX...');

  // 1. Bersihkan data lama jika ada
  await prisma.ticket.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.ticketType.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.webhookEvent.deleteMany({});

  // 2. Buat Admin dan Customer default
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('admin123', saltRounds);
  const customerPassword = await bcrypt.hash('customer123', saltRounds);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@gotix.com',
      passwordHash: adminPassword,
      fullName: 'GOTIX Administrator',
      role: Role.ADMIN,
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      email: 'alex@example.com',
      passwordHash: customerPassword,
      fullName: 'Alex Vance',
      role: Role.CUSTOMER,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'sarah@example.com',
      passwordHash: customerPassword,
      fullName: 'Sarah Connor',
      role: Role.CUSTOMER,
    },
  });

  console.log(`[SEED] Pengguna berhasil dibuat:`);
  console.log(` - Admin    : ${admin.email} (password: admin123)`);
  console.log(` - Customer : ${customer1.email}, ${customer2.email} (password: customer123)`);

  // 3. Buat Event Unggulan dengan Nuansa Gothic Luxury
  const event1 = await prisma.event.create({
    data: {
      title: 'Nocturnal Symphony: Requiem for the Shadows',
      description: 'Sebuah konser orkestra neoklasik gelap berpadu dengan aransemen paduan suara katedral kuno di bawah remang cahaya lilin obsidian.',
      location: 'Grand Obsidian Hall, Jakarta',
      eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 hari ke depan
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
      status: EventStatus.PUBLISHED,
      ticketTypes: {
        create: [
          {
            name: 'Regular',
            price: 250000,
            totalQuota: 100,
            reservedQuota: 0,
            paidQuota: 0,
          },
          {
            name: 'VIP',
            price: 750000,
            totalQuota: 30,
            reservedQuota: 0,
            paidQuota: 0,
          },
        ],
      },
    },
  });

  const event2 = await prisma.event.create({
    data: {
      title: 'Midnight Masquerade: The Violet Veil',
      description: 'Pesta dansa bertopeng mewah dengan dress code Gothic Victorian. Dihadiri oleh musisi ambient internasional dan pertunjukan visual misterius.',
      location: 'Royal Plum Ballroom, Bandung',
      eventDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 hari ke depan
      imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop',
      status: EventStatus.PUBLISHED,
      ticketTypes: {
        create: [
          {
            name: 'Regular',
            price: 350000,
            totalQuota: 50,
            reservedQuota: 0,
            paidQuota: 0,
          },
          {
            name: 'VIP',
            price: 1200000,
            totalQuota: 15,
            reservedQuota: 0,
            paidQuota: 0,
          },
        ],
      },
    },
  });

  const event3 = await prisma.event.create({
    data: {
      title: 'Eclipse Echoes: Dark Electronic Gathering',
      description: 'Festival musik darkwave dan synthwave atmosferik di ruang hangar industrial beraksen lampu ultraviolet.',
      location: 'Charcoal Warehouse, Surabaya',
      eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
      status: EventStatus.PUBLISHED,
      ticketTypes: {
        create: [
          {
            name: 'Regular',
            price: 180000,
            totalQuota: 5, // Sengaja kuota sedikit untuk simulasi habis
            reservedQuota: 0,
            paidQuota: 0,
          },
          {
            name: 'VIP',
            price: 500000,
            totalQuota: 2,
            reservedQuota: 0,
            paidQuota: 0,
          },
        ],
      },
    },
  });

  console.log(`[SEED] Event berhasil dibuat:`);
  console.log(` 1. ${event1.title}`);
  console.log(` 2. ${event2.title}`);
  console.log(` 3. ${event3.title}`);
  console.log('[SEED] Seeding selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('[SEED ERROR]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
