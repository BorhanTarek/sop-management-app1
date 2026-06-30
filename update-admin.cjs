const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('123123', 10);
  const user = await prisma.user.update({
    where: { email: 'admin@greenline.com' },
    data: {
      email: 'Admin',
      passwordHash: hash,
    },
  });
  console.log('✅ Credentials updated!');
  console.log('   Email/Username:', user.email);
  console.log('   Password: 123123');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
