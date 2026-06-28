const bcrypt = require('bcryptjs');
const prisma = require('../../config/db');
const { signToken } = require('../../utils/jwt');

async function login(email, password) {
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: 'insensitive',
      },
    },
    include: { roles: { include: { role: true } } },
  });
  if (!user || !user.isActive) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }
  const roles = user.roles.map((ur) => ur.role.name);
  const token = signToken({ userId: user.id, email: user.email, roles });
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      department: user.department,
      roles,
    },
  };
}

module.exports = { login };
