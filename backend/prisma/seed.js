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

  // 3. Upsert Event Unggulan (Minimal 1 per Kategori)
  const eventData = [
    {
      title: 'Nocturnal Symphony: Requiem for the Shadows',
      description:
        'Sebuah konser orkestra neoklasik megah berpadu dengan aransemen katedral kuno, gesekan cello emosional, dan cahaya lilin temaram.',
      location: 'Grand Obsidian Hall, Jakarta',
      startsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      imageUrl: '/images/events/orchestra.jpg',
      ticketTypes: [
        { name: 'Regular', price: 250000, quota: 100 },
        { name: 'VIP', price: 750000, quota: 30 },
      ],
    },
    {
      title: 'Midnight Masquerade: The Violet Veil',
      description:
        'Pementasan teater drama bertopeng dan pesta dansa mewah bertema Gothic Victorian dengan visual teatrikal panggung misterius.',
      location: 'Royal Plum Ballroom, Bandung',
      startsAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      imageUrl: '/images/events/theater.jpg',
      ticketTypes: [
        { name: 'Regular', price: 350000, quota: 50 },
        { name: 'VIP', price: 1200000, quota: 15 },
      ],
    },
    {
      title: 'Eclipse Echoes: Dark Electronic Gathering',
      description:
        'Festival konser musik darkwave, synthwave, dan post-punk atmosferik di ruang hangar industrial beraksen lampu ultraviolet neon violet.',
      location: 'Charcoal Warehouse, Surabaya',
      startsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      imageUrl: '/images/events/concert.jpg',
      ticketTypes: [
        { name: 'Regular', price: 180000, quota: 50 },
        { name: 'VIP', price: 500000, quota: 20 },
      ],
    },
    {
      title: 'Cursed Canvas: Dark Surrealism & Sculpture',
      description:
        'Pameran instalasi seni patung gothic dan kurasi lukisan surealisme gelap berbingkai perak antik dalam lorong galeri temaram bernuansa mistis.',
      location: 'Silver Mist Crypt Gallery, Yogyakarta',
      startsAt: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      imageUrl: '/images/events/exhibition.jpg',
      ticketTypes: [
        { name: 'Regular', price: 150000, quota: 40 },
        { name: 'VIP', price: 450000, quota: 10 },
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
          imageUrl: ev.imageUrl,
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
    } else {
      await prisma.event.update({
        where: { id: existing.id },
        data: {
          description: ev.description,
          imageUrl: ev.imageUrl,
          location: ev.location,
          startsAt: ev.startsAt,
        },
      });

      // Sinkronisasi kuota dan harga tipe tiket
      for (const tt of ev.ticketTypes) {
        const existingTt = await prisma.ticketType.findFirst({
          where: { eventId: existing.id, name: tt.name },
        });

        if (existingTt) {
          await prisma.ticketType.update({
            where: { id: existingTt.id },
            data: {
              price: tt.price,
              quota: tt.quota,
            },
          });
        } else {
          await prisma.ticketType.create({
            data: {
              eventId: existing.id,
              name: tt.name,
              price: tt.price,
              quota: tt.quota,
              reservedCount: 0,
            },
          });
        }
      }
      console.log(`[SEED] Event dan kuota tiket diperbarui: ${ev.title}`);
    }
  }

  console.log('[SEED] Seeding selesai dengan sukses!');
}

module.exports = { seed: main };

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('[SEED ERROR]:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
