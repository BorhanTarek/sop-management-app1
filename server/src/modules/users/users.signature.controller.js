const prisma = require('../../config/db');

/**
 * GET /api/users/me/signature
 * Returns the current user's signature data and onboarding flag.
 */
async function getMySignature(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        hasSetSignature: true,
        signatureData: true,
        signatureSetAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/users/me/signature
 * Saves or updates the current user's Base64 signature.
 * Sets hasSetSignature = true on the user record.
 * Body: { signatureData: "data:image/png;base64,..." }
 */
async function saveMySignature(req, res, next) {
  try {
    const { signatureData } = req.body;

    if (!signatureData || typeof signatureData !== 'string') {
      return res.status(400).json({ error: 'signatureData is required and must be a Base64 string.' });
    }

    // Basic validation: must be a base64 PNG data URL
    if (!signatureData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'signatureData must be a valid image data URL.' });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        signatureData,
        hasSetSignature: true,
        signatureSetAt: new Date(),
      },
      select: {
        id: true,
        fullName: true,
        hasSetSignature: true,
        signatureSetAt: true,
      },
    });

    res.json({ message: 'Signature saved successfully.', user: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMySignature, saveMySignature };
