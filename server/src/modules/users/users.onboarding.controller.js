const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function saveOnboarding(req, res, next) {
  try {
    const { password, signatureData } = req.body;
    const updateData = {};

    if (password) {
      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }
      updateData.passwordHash = await bcrypt.hash(password, 10);
      updateData.hasChangedPassword = true;
    }

    if (signatureData) {
      if (typeof signatureData !== 'string' || !signatureData.startsWith('data:image/')) {
        return res.status(400).json({ error: 'signatureData must be a valid image data URL.' });
      }
      updateData.signatureData = signatureData;
      updateData.hasSetSignature = true;
      updateData.signatureSetAt = new Date();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No data provided to update.' });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        hasSetSignature: true,
        hasChangedPassword: true,
        signatureSetAt: true,
      },
    });

    res.json({ message: 'Onboarding step completed successfully.', user: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { saveOnboarding };
