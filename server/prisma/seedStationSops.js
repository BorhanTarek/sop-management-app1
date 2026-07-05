const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sop = await prisma.sop.findFirst({ where: { status: 'published' } });
  if (!sop) {
    console.log('No published SOPs found.');
    return;
  }
  const stations = await prisma.station.findMany();
  for (const station of stations) {
    await prisma.stationSop.upsert({
      where: { stationId_procedureType: { stationId: station.id, procedureType: 'opening' } },
      update: { sopId: sop.id },
      create: { stationId: station.id, sopId: sop.id, procedureType: 'opening' },
    });
    await prisma.stationSop.upsert({
      where: { stationId_procedureType: { stationId: station.id, procedureType: 'closing' } },
      update: { sopId: sop.id },
      create: { stationId: station.id, sopId: sop.id, procedureType: 'closing' },
    });
  }
  console.log('Assigned SOP ' + sop.title + ' as Opening and Closing Procedure for all stations.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
