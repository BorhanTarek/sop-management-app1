const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    // Let's check if the password is "123123"
    const is123123 = await bcrypt.compare('123123', u.passwordHash);
    console.log(`User: ${u.email}, is password "123123"?: ${is123123}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
