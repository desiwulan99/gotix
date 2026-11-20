const { PrismaClient, Role, EventStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Memeriksa data awal database GOTIX...');

  // 1. Cek atau Buat Admin
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@gotix.com' },
  });

  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('admin123', saltRounds);
  const customerPassword = await bcrypt.hash('customer123', saltRounds);

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: 'admin@gotix.com',
        passwordHash: adminPassword,
        fullName: 'GOTIX Administrator',
        role: Role.ADMIN,
      },
    });
    console.log('[SEED] Admin default berhasil dibuat: admin@gotix.com (pass: admin123)');
  }

  // 2. Cek atau Buat Customer 1
  const existingCustomer1 = await prisma.user.findUnique({
    where: { email: 'alex@example.com' },
  });

  if (!existingCustomer1) {
    await prisma.user.create({
      data: {
        email: 'alex@example.com',
        passwordHash: customerPassword,
        fullName: 'Alex Vance',
        role: Role.CUSTOMER,
      },
    });
    console.log('[SEED] Customer 1 berhasil dibuat: alex@example.com (pass: customer123)');
  }

  // 3. Cek atau Buat Customer 2
  const existingCustomer2 = await prisma.user.findUnique({
    where: { email: 'sarah@example.com' },
  });

  if (!existingCustomer2) {
    await prisma.user.create({
      data: {
        email: 'sarah@example.com',
        passwordHash: customerPassword,
        fullName: 'Sarah Connor',
        role: Role.CUSTOMER,
      },
    });
    console.log('[SEED] Customer 2 berhasil dibuat: sarah@example.com (pass: customer123)');
  }

  // 4. Cek atau Buat Event Bawaan jika belum ada event sama sekali
  const eventCount = await prisma.event.count();
  if (eventCount === 0) {
    console.log('[SEED] Membuat event unggulan default...');

    await prisma.event.create({
      data: {
        title: 'Nocturnal Symphony: Requiem for the Shadows',
        description: 'Sebuah konser orkestra neoklasik gelap berpadu dengan aransemen paduan suara katedral kuno di bawah remang cahaya lilin obsidian.',
        location: 'Grand Obsidian Hall, Jakarta',
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
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

    await prisma.event.create({
      data: {
        title: 'Midnight Masquerade: The Violet Veil',
        description: 'Pesta dansa bertopeng mewah dengan dress code Gothic Victorian. Dihadiri oleh musisi ambient internasional dan pertunjukan visual misterius.',
        location: 'Royal Plum Ballroom, Bandung',
        eventDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
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

    await prisma.event.create({
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
              totalQuota: 5,
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
    console.log('[SEED] 3 Event unggulan berhasil dibuat.');
  } else {
    console.log(`[SEED] Database sudah memiliki ${eventCount} event, melewati pembuatan event baru.`);
  }

  console.log('[SEED] Inisialisasi data selesai.');
}

main()
  .catch((e) => {
    console.error('[SEED ERROR]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
