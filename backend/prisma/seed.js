const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Memulai proses seeding database GOTIX (Production JS)...');

  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('AdminPass123!', saltRounds);
  const buyerPassword = await bcrypt.hash('BuyerPass123!', saltRounds);

  // 1. Upsert Admin demo
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gotix.id' },
    update: {
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
    create: {
      email: 'admin@gotix.id',
      passwordHash: adminPassword,
      fullName: 'GOTIX Curator (Admin)',
      role: 'ADMIN',
    },
  });

  // 2. Upsert Buyer demo
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer1@example.com' },
    update: {
      passwordHash: buyerPassword,
      role: 'BUYER',
    },
    create: {
      email: 'buyer1@example.com',
      passwordHash: buyerPassword,
      fullName: 'Gothic Pilgrim (Buyer)',
      role: 'BUYER',
    },
  });

  console.log(`[SEED] Akun Pengguna Terkonfigurasi:`);
  console.log(` - Admin : ${admin.email} | Password: AdminPass123!`);
  console.log(` - Buyer : ${buyer.email} | Password: BuyerPass123!`);

  // 3. Upsert Event Unggulan
  const eventData = [
    {
      title: 'Nocturnal Symphony: Requiem for the Shadows',
      description:
        'Sebuah konser orkestra neoklasik gelap berpadu dengan aransemen paduan suara katedral kuno di bawah remang cahaya lilin obsidian.',
      location: 'Grand Obsidian Hall, Jakarta',
      startsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      ticketTypes: [
        { name: 'Regular', price: 250000, quota: 100 },
        { name: 'VIP', price: 750000, quota: 30 },
      ],
    },
    {
      title: 'Midnight Masquerade: The Violet Veil',
      description:
        'Pesta dansa bertopeng mewah dengan dress code Gothic Victorian. Dihadiri oleh musisi ambient internasional dan pertunjukan visual misterius.',
      location: 'Royal Plum Ballroom, Bandung',
      startsAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      ticketTypes: [
        { name: 'Regular', price: 350000, quota: 50 },
        { name: 'VIP', price: 1200000, quota: 15 },
      ],
    },
    {
      title: 'Eclipse Echoes: Dark Electronic Gathering',
      description:
        'Festival musik darkwave dan synthwave atmosferik di ruang hangar industrial beraksen lampu ultraviolet.',
      location: 'Charcoal Warehouse, Surabaya',
      startsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ticketTypes: [
        { name: 'Regular', price: 180000, quota: 5 },
        { name: 'VIP', price: 500000, quota: 2 },
      ],
    },
  ];

  for (const ev of eventData) {
    const existing = await prisma.event.findFirst({
      where: { title: ev.title },
    });

    if (!existing) {
      await prisma.event.create({
        data: {
          title: ev.title,
          description: ev.description,
          location: ev.location,
          startsAt: ev.startsAt,
          status: 'PUBLISHED',
          ticketTypes: {
            create: ev.ticketTypes.map((tt) => ({
              name: tt.name,
              price: tt.price,
              quota: tt.quota,
              reservedCount: 0,
            })),
          },
        },
      });
      console.log(`[SEED] Event baru dibuat: ${ev.title}`);
    }
  }

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
