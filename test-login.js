const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testLogin(email, password) {
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
      },
    },
  });
  
  let matchedUser = user;
  if (!matchedUser) {
    const allUsers = await prisma.user.findMany();
    matchedUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  if (!matchedUser) {
    console.log(`User not found for: ${email}`);
    return;
  }
  const valid = await bcrypt.compare(password, matchedUser.passwordHash);
  console.log(`User found: ${matchedUser.email}, Password valid: ${valid}`);
}

async function main() {
  await testLogin('admin@asda', '123123');
  await testLogin('ADMIN@ASDA', '123123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
