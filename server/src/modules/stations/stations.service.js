const prisma = require('../../config/db');

async function getAll() {
  return prisma.station.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      stationSops: { include: { sop: { select: { id: true, title: true, status: true } } } },
    },
  });
}

async function getMyStations(userId) {
  const assignments = await prisma.userStation.findMany({
    where: { userId },
    include: {
      station: {
        include: {
          stationSops: { include: { sop: { select: { id: true, title: true, status: true } } } },
          sessions: {
            where: {
              userId,
              shiftDate: new Date().toISOString().slice(0, 10),
            },
            orderBy: { startedAt: 'desc' },
            take: 2,
          },
        },
      },
    },
  });
  return assignments.map((a) => a.station);
}

async function getById(id) {
  const station = await prisma.station.findUnique({
    where: { id },
    include: {
      stationSops: { include: { sop: true } },
      userAssignments: { include: { user: { select: { id: true, fullName: true, email: true } } } },
    },
  });
  if (!station) throw Object.assign(new Error('Station not found'), { status: 404 });
  return station;
}

async function assignSop(stationId, sopId, procedureType) {
  return prisma.stationSop.upsert({
    where: { stationId_procedureType: { stationId, procedureType } },
    update: { sopId },
    create: { stationId, sopId, procedureType },
  });
}

module.exports = { getAll, getMyStations, getById, assignSop };
