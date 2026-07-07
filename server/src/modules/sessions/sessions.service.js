const prisma = require('../../config/db');

/**
 * Start a viewer-portal SOP session (no station required).
 * Called when any user starts the Wizard Guide from the Browse/SOP view page.
 */
async function startViewerSession(userId, sopId) {
  const sop = await prisma.sop.findUnique({ where: { id: sopId } });
  if (!sop) throw Object.assign(new Error('SOP not found'), { status: 404 });

  const today = new Date().toISOString().slice(0, 10);

  // Abandon any previous in-progress viewer session for this user+sop today
  await prisma.sopSession.updateMany({
    where: { userId, sopId, source: 'viewer', shiftDate: today, status: 'in_progress' },
    data: { status: 'abandoned' },
  });

  const session = await prisma.sopSession.create({
    data: {
      sopId,
      userId,
      procedureType: 'viewer',
      source: 'viewer',
      shiftDate: today,
      status: 'in_progress',
    },
    include: {
      sop: { select: { id: true, title: true, referenceCode: true } },
    },
  });

  return session;
}

/**
 * Start a new SOP execution session for a station master.
 * Validates that the user is assigned to the requested station.
 */
async function startSession(userId, stationId, procedureType) {
  // Security: verify user is assigned to this station
  const assignment = await prisma.userStation.findUnique({
    where: { userId_stationId: { userId, stationId } },
  });
  if (!assignment) {
    throw Object.assign(
      new Error('Access denied: you are not assigned to this station'),
      { status: 403 }
    );
  }

  // Find the configured SOP for this station + procedure type
  const stationSop = await prisma.stationSop.findUnique({
    where: { stationId_procedureType: { stationId, procedureType } },
    include: { sop: { include: { steps: { orderBy: { sortOrder: 'asc' } } } } },
  });
  if (!stationSop) {
    throw Object.assign(
      new Error(`No ${procedureType} procedure configured for this station`),
      { status: 404 }
    );
  }

  // Abandon any in-progress session for same station+type+date
  const today = new Date().toISOString().slice(0, 10);
  await prisma.sopSession.updateMany({
    where: { userId, stationId, procedureType, shiftDate: today, status: 'in_progress' },
    data: { status: 'abandoned' },
  });

  const session = await prisma.sopSession.create({
    data: {
      stationId,
      sopId: stationSop.sopId,
      userId,
      procedureType,
      shiftDate: today,
      status: 'in_progress',
    },
    include: {
      station: true,
      sop: { include: { steps: { orderBy: { sortOrder: 'asc' } } } },
    },
  });

  return session;
}

/**
 * Log a step acknowledgment within an active session.
 */
async function acknowledgeStep(sessionId, userId, stepId, stepTitle, stepType, branchChoice) {
  // Verify session belongs to this user and is active
  const session = await prisma.sopSession.findUnique({ where: { id: sessionId } });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  if (session.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 });
  if (session.status !== 'in_progress') {
    throw Object.assign(new Error('Session is not active'), { status: 400 });
  }

  return prisma.sopSessionStep.create({
    data: { sessionId, stepId, stepTitle, stepType, branchChoice: branchChoice || null },
  });
}

/**
 * Mark a session as completed.
 */
async function completeSession(sessionId, userId) {
  const session = await prisma.sopSession.findUnique({ where: { id: sessionId } });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  if (session.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 });

  return prisma.sopSession.update({
    where: { id: sessionId },
    data: { status: 'completed', completedAt: new Date() },
    include: {
      station: true,
      user: { select: { id: true, fullName: true, email: true } },
      stepLogs: { orderBy: { acknowledgedAt: 'asc' } },
    },
  });
}

/**
 * Get a single session (for wizard restoration).
 */
async function getSession(sessionId, userId) {
  const session = await prisma.sopSession.findUnique({
    where: { id: sessionId },
    include: {
      station: true,
      sop: { include: { steps: { orderBy: { sortOrder: 'asc' } } } },
      stepLogs: { orderBy: { acknowledgedAt: 'asc' } },
    },
  });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  if (session.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 });
  return session;
}

/**
 * Admin: list all sessions (compliance dashboard).
 */
async function listSessions({ stationId, date, status, userId: filterUserId } = {}) {
  return prisma.sopSession.findMany({
    where: {
      ...(stationId && { stationId }),
      ...(date && { shiftDate: date }),
      ...(status && { status }),
      ...(filterUserId && { userId: filterUserId }),
    },
    include: {
      station: true,
      user: { select: { id: true, fullName: true, email: true } },
      sop: { select: { id: true, title: true } },
      stepLogs: { orderBy: { acknowledgedAt: 'asc' } },
    },
    orderBy: { startedAt: 'desc' },
    take: 200,
  });
}

/**
 * Admin: rich SOPs wizard log viewer — full step-by-step detail per session.
 */
async function getSopLogs({ sopId, userId: filterUserId, dateFrom, dateTo, status, search } = {}) {
  return prisma.sopSession.findMany({
    where: {
      ...(sopId && { sopId }),
      ...(filterUserId && { userId: filterUserId }),
      ...(status && { status }),
      ...(dateFrom && dateTo && { shiftDate: { gte: dateFrom, lte: dateTo } }),
      ...(dateFrom && !dateTo && { shiftDate: { gte: dateFrom } }),
      ...(!dateFrom && dateTo && { shiftDate: { lte: dateTo } }),
      ...(search && {
        OR: [
          { user: { fullName: { contains: search } } },
          { sop: { title: { contains: search } } },
        ],
      }),
    },
    include: {
      station: { select: { id: true, name: true, stationCode: true } },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          department: true,
          signatureData: true,
          roles: { include: { role: true } },
        },
      },
      sop: { select: { id: true, title: true, referenceCode: true, currentVersion: true } },
      stepLogs: { orderBy: { acknowledgedAt: 'asc' } },
    },
    orderBy: { startedAt: 'desc' },
    take: 500,
  });
}

module.exports = { startSession, startViewerSession, acknowledgeStep, completeSession, getSession, listSessions, getSopLogs };
