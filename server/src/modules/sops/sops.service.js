const prisma = require('../../config/db');
const { bumpVersion } = require('../../utils/semver');

// Validate a userId exists in DB before using as FK (guards against stale JWTs after DB re-seed)
async function safeUserId(userId) {
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  return user ? userId : null;
}

async function getAll({ status, categoryId, docType, search, page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const where = {
    ...(status && { status }),
    ...(categoryId && { categoryId }),
    ...(docType && { docType }),
    ...(search && { title: { contains: search, mode: 'insensitive' } }),
  };
  const [sops, total] = await Promise.all([
    prisma.sop.findMany({
      where,
      include: {
        category: true,
        owner: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.sop.count({ where }),
  ]);
  return { sops, total, page: Number(page), limit: Number(limit) };
}

async function getById(id) {
  const sop = await prisma.sop.findUnique({
    where: { id },
    include: {
      category: true,
      owner: { select: { id: true, fullName: true, email: true } },
      versions: {
        where: { isCurrent: true },
        take: 1,
      },
    },
  });

  if (!sop) throw Object.assign(new Error('SOP not found'), { status: 404 });

  const currentVersionId = sop.versions[0]?.id || null;

  // Query only the steps belonging to the current active version
  const steps = currentVersionId
    ? await prisma.sopStep.findMany({
        where: { versionId: currentVersionId },
        orderBy: { sortOrder: 'asc' },
      })
    : [];

  // Delete versions relation and assign steps to match the expected format
  delete sop.versions;
  sop.steps = steps.map(st => ({
    ...st,
    attentionPoints: st.attentionPoints ? JSON.parse(st.attentionPoints) : [],
    safetyPoints:    st.safetyPoints    ? JSON.parse(st.safetyPoints)    : [],
  }));

  return sop;
}

async function create({ title, referenceCode, categoryId, ownerId, docType, tags, steps = [], contentJson }, userId) {
  const safeId = await safeUserId(userId);
  const safeOwner = await safeUserId(ownerId || userId);

  const sop = await prisma.sop.create({
    data: {
      title,
      referenceCode: referenceCode || null,
      categoryId: categoryId || null,
      ownerId: safeOwner,
      docType: docType || 'SOP',
      tags,
      status: 'draft',
      currentVersion: '1.0',
    },
  });

  const version = await prisma.sopVersion.create({
    data: {
      sopId: sop.id,
      version: '1.0',
      contentJson: contentJson || JSON.stringify({ steps }),
      isCurrent: true,
      createdById: safeId,
    },
  });

  if (steps.length > 0) {
    await prisma.sopStep.createMany({
      data: steps.map((s, i) => ({
        sopId: sop.id,
        versionId: version.id,
        stepNumber: i + 1,
        title: s.title,
        body: s.body,
        stepType: s.stepType || 'action',
        refCode: s.refCode,
        sortOrder: i,
        branchData: s.branchData || null,
        attentionPoints: s.attentionPoints?.length ? JSON.stringify(s.attentionPoints) : null,
        safetyPoints:    s.safetyPoints?.length    ? JSON.stringify(s.safetyPoints)    : null,
      })),
    });
  }

  await prisma.changeLog.create({
    data: {
      sopId: sop.id,
      versionTo: '1.0',
      changeSummary: 'Initial version created',
      changedById: safeId,
    },
  });

  return getById(sop.id);
}

async function update(id, { title, categoryId, ownerId, docType, tags, steps, contentJson, bumpType, changeSummary }, userId) {
  const existing = await getById(id);
  const newVersion = bumpVersion(existing.currentVersion, bumpType || 'minor');
  const safeId = await safeUserId(userId);

  // Mark old version as not current
  await prisma.sopVersion.updateMany({ where: { sopId: id, isCurrent: true }, data: { isCurrent: false } });

  // Create new version
  const version = await prisma.sopVersion.create({
    data: {
      sopId: id,
      version: newVersion,
      contentJson: contentJson || JSON.stringify({ steps }),
      isCurrent: true,
      createdById: safeId,
    },
  });

  if (steps && steps.length > 0) {
    await prisma.sopStep.createMany({
      data: steps.map((s, i) => ({
        sopId: id,
        versionId: version.id,
        stepNumber: i + 1,
        title: s.title,
        body: s.body,
        stepType: s.stepType || 'action',
        refCode: s.refCode,
        sortOrder: i,
        branchData: s.branchData || null,
        attentionPoints: s.attentionPoints?.length ? JSON.stringify(s.attentionPoints) : null,
        safetyPoints:    s.safetyPoints?.length    ? JSON.stringify(s.safetyPoints)    : null,
      })),
    });
  }

  await prisma.changeLog.create({
    data: {
      sopId: id,
      versionFrom: existing.currentVersion,
      versionTo: newVersion,
      changeSummary: changeSummary || 'Updated',
      changedById: safeId,
    },
  });

  return prisma.sop.update({
    where: { id },
    data: { title, categoryId, ownerId, docType, tags, currentVersion: newVersion, updatedAt: new Date() },
    include: { category: true, owner: { select: { id: true, fullName: true } } },
  });
}

async function publish(id, userId) {
  const sop = await getById(id);
  if (sop.status === 'published') return sop;
  return prisma.sop.update({
    where: { id },
    data: { status: 'published', publishedAt: new Date() },
  });
}

async function archive(id) {
  return prisma.sop.update({ where: { id }, data: { status: 'archived' } });
}

async function restore(id) {
  return prisma.sop.update({ where: { id }, data: { status: 'draft' } });
}

async function remove(id) {
  await getById(id);
  return prisma.sop.delete({ where: { id } });
}

async function getVersions(sopId) {
  return prisma.sopVersion.findMany({
    where: { sopId },
    include: { createdBy: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

async function getChangelog(sopId) {
  return prisma.changeLog.findMany({
    where: { sopId },
    include: { changedBy: { select: { id: true, fullName: true } } },
    orderBy: { changedAt: 'desc' },
  });
}

async function restoreVersion(sopId, targetVersion, userId) {
  const ver = await prisma.sopVersion.findFirst({ where: { sopId, version: targetVersion } });
  if (!ver) throw Object.assign(new Error('Version not found'), { status: 404 });

  const sop = await getById(sopId);
  const newVersion = bumpVersion(sop.currentVersion, 'minor');

  await prisma.sopVersion.updateMany({ where: { sopId, isCurrent: true }, data: { isCurrent: false } });
  await prisma.sopVersion.create({
    data: {
      sopId,
      version: newVersion,
      contentJson: ver.contentJson,
      isCurrent: true,
      createdById: userId,
    },
  });

  await prisma.changeLog.create({
    data: {
      sopId,
      versionFrom: sop.currentVersion,
      versionTo: newVersion,
      changeSummary: `Restored from version ${targetVersion}`,
      changedById: userId,
    },
  });

  return prisma.sop.update({ where: { id: sopId }, data: { currentVersion: newVersion } });
}

module.exports = { getAll, getById, create, update, publish, archive, restore, remove, getVersions, getChangelog, restoreVersion };
