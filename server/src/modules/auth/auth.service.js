const bcrypt = require('bcryptjs');
const prisma = require('../../config/db');
const { signToken } = require('../../utils/jwt');

async function login(email, password) {
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
      },
    },
    include: { roles: { include: { role: true } } },
  });
  
  // If not found with exact match, do a fallback case-insensitive search
  let matchedUser = user;
  if (!matchedUser) {
    const allUsers = await prisma.user.findMany({
      include: { roles: { include: { role: true } } },
    });
    matchedUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  if (!matchedUser || !matchedUser.isActive) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }
  const valid = await bcrypt.compare(password, matchedUser.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }
  const roles = matchedUser.roles.map((ur) => ur.role.name);
  const token = signToken({ userId: matchedUser.id, email: matchedUser.email, roles });
  return {
    token,
    user: {
      id: matchedUser.id,
      email: matchedUser.email,
      fullName: matchedUser.fullName,
      department: matchedUser.department,
      roles,
    },
  };
}

module.exports = { login };
