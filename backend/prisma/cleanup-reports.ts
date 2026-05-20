import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const deleted = await prisma.reporte.deleteMany({});
    console.log(`✅ ${deleted.count} reportes eliminados`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
