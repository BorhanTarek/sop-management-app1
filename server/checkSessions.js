const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const sessions = await prisma.sopSession.findMany();
  console.log(JSON.stringify(sessions, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
