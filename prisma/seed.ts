import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Example: Create a test shop (for development only)
  if (process.env.NODE_ENV === 'development') {
    const testShop = await prisma.shop.upsert({
      where: { domain: 'test-store.myshopify.com' },
      create: {
        domain: 'test-store.myshopify.com',
        accessTokenOffline: 'test_token',
        plan: 'development',
        status: 'active',
      },
      update: {},
    });

    console.log('Created test shop:', testShop.domain);

    // Create test settings
    await prisma.settings.upsert({
      where: { shopId: testShop.id },
      create: {
        shopId: testShop.id,
        mappingOptions: {
          newOrder: {
            enabled: true,
            boardId: null,
            listId: null,
          },
        },
      },
      update: {},
    });

    console.log('Created test settings');
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

