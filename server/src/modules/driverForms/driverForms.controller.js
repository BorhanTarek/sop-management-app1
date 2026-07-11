const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Submit a new Driver Service Form (driver + admin)
exports.submit = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      shiftDate,
      driverName, driverId,
      shiftStartTime, shiftEndTime, shiftCode, trainType, overtimeHours, safetyNotice,
      cycleDetails, cabinPersonnel, degradedOps,
      driSopsApplied, ecoActuated, remarks,
      damageMainline, damageDepot, damageTime,
      rollingstockDamage, infraDamageSignaling, infraDamageTrack, infraDamageOthers,
      ccpInstruction, ccpEcoActuated, ccpConfirmation, passengersInformed,
      troubleshootingUnits, troSopsApplied, isolatedSwitches,
      actionOnCBs, isolatedDoors, compressorsOutOfService, vvvfsOutOfService, sivsOutOfService,
      isolatedBrakes,
      activeBrakingBogiesFrom, activeBrakingBogiesTo,
      speedRestrictions, pressureGaugeReading, trainService
    } = req.body;

    const form = await prisma.driverServiceForm.create({
      data: {
        userId,
        shiftDate: shiftDate || new Date().toISOString().slice(0, 10),
        driverName: driverName || '',
        driverId: driverId || '',
        shiftStartTime, shiftEndTime, shiftCode, trainType, overtimeHours, safetyNotice,
        cycleDetails: cycleDetails ? JSON.stringify(cycleDetails) : null,
        cabinPersonnel: cabinPersonnel ? JSON.stringify(cabinPersonnel) : null,
        degradedOps: degradedOps ? JSON.stringify(degradedOps) : null,
        driSopsApplied, ecoActuated, remarks,
        damageMainline, damageDepot, damageTime,
        rollingstockDamage, infraDamageSignaling, infraDamageTrack, infraDamageOthers,
        ccpInstruction, ccpEcoActuated, ccpConfirmation, passengersInformed,
        troubleshootingUnits, troSopsApplied,
        isolatedSwitches: isolatedSwitches ? JSON.stringify(isolatedSwitches) : null,
        actionOnCBs, isolatedDoors, compressorsOutOfService, vvvfsOutOfService, sivsOutOfService,
        isolatedBrakes: isolatedBrakes ? JSON.stringify(isolatedBrakes) : null,
        activeBrakingBogiesFrom, activeBrakingBogiesTo,
        speedRestrictions, pressureGaugeReading, trainService
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, signatureData: true } }
      }
    });

    res.status(201).json(form);
  } catch (error) {
    console.error('Driver form submit error:', error);
    res.status(500).json({ error: 'Failed to submit driver service form' });
  }
};

// List all forms — admin sees all, driver sees their own
exports.list = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.roles?.includes('admin') ||
                    req.user.roles?.includes('station_manager') ||
                    req.user.roles?.includes('transport_manager');

    const where = isAdmin ? {} : { userId };

    const forms = await prisma.driverServiceForm.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true, signatureData: true } }
      }
    });

    // Parse JSON fields for convenience
    const parsed = forms.map(f => parseJsonFields(f));
    res.json(parsed);
  } catch (error) {
    console.error('Driver form list error:', error);
    res.status(500).json({ error: 'Failed to fetch driver service forms' });
  }
};

// Get single form
exports.get = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.roles?.includes('admin') ||
                    req.user.roles?.includes('station_manager') ||
                    req.user.roles?.includes('transport_manager');

    const form = await prisma.driverServiceForm.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, signatureData: true } }
      }
    });

    if (!form) return res.status(404).json({ error: 'Form not found' });
    if (!isAdmin && form.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(parseJsonFields(form));
  } catch (error) {
    console.error('Driver form get error:', error);
    res.status(500).json({ error: 'Failed to fetch form' });
  }
};

// Delete form (admin only)
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.driverServiceForm.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Driver form delete error:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
};

// Helper: safely parse stored JSON fields
function parseJsonFields(form) {
  const jsonFields = ['cycleDetails', 'cabinPersonnel', 'degradedOps', 'isolatedSwitches', 'isolatedBrakes'];
  const result = { ...form };
  for (const field of jsonFields) {
    if (result[field] && typeof result[field] === 'string') {
      try { result[field] = JSON.parse(result[field]); } catch (_) { /* leave as string */ }
    }
  }
  return result;
}
