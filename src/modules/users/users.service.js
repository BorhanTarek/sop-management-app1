const bcrypt = require('bcryptjs');
const prisma = require('../../config/db');

async function getAll({ search, role, isActive } = {}) {
  return prisma.user.findMany({
    where: {
      ...(search && {
        OR: [
          { fullName: { contains: search } },
          { email: { contains: search } },
        ],
      }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(role && { roles: { some: { role: { name: role } } } }),
    },
    include: { roles: { include: { role: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

async function getById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { roles: { include: { role: true } } },
  });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user;
}

async function create({ email, password, fullName, department, roleNames = ['viewer'] }) {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw Object.assign(new Error('Email already in use'), { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const roles = await prisma.role.findMany({ where: { name: { in: roleNames } } });

  return prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      department,
      roles: { create: roles.map((r) => ({ roleId: r.id })) },
    },
    include: { roles: { include: { role: true } } },
  });
}

async function update(id, { fullName, department, isActive, roleNames }) {
  await getById(id);

  if (roleNames) {
    await prisma.userRole.deleteMany({ where: { userId: id } });
    const roles = await prisma.role.findMany({ where: { name: { in: roleNames } } });
    await prisma.userRole.createMany({
      data: roles.map((r) => ({ userId: id, roleId: r.id })),
    });
  }

  return prisma.user.update({
    where: { id },
    data: { fullName, department, isActive },
    include: { roles: { include: { role: true } } },
  });
}

async function remove(id) {
  await getById(id);
  return prisma.user.delete({ where: { id } });
}

module.exports = { getAll, getById, create, update, remove };
