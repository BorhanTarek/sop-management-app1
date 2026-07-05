const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

exports.list = async (req, res, next) => {
  try {
    const userRoles = req.user.roles || [];
    const isAdminOrManager = userRoles.some(r => ['admin', 'station_manager', 'transport_manager'].includes(r));

    const where = {};
    if (!isAdminOrManager) {
      where.isPublished = true;
      where.roleVisibility = {
        some: {
          role: { name: { in: userRoles } }
        }
      };
    }

    const wis = await prisma.workInstruction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        acknowledgments: {
          where: { userId: req.user.id }
        },
        roleVisibility: {
          include: { role: true }
        },
        _count: {
          select: { acknowledgments: true }
        }
      }
    });

    const results = wis.map(wi => ({
      id: wi.id,
      title: wi.title,
      content: wi.content,
      imageUrl: wi.imageUrl,
      isPublished: wi.isPublished,
      createdAt: wi.createdAt,
      updatedAt: wi.updatedAt,
      ackCount: wi._count.acknowledgments,
      isAcknowledged: wi.acknowledgments.length > 0,
      permittedRoles: wi.roleVisibility.map(rv => rv.role.name)
    }));

    res.json(results);
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const wi = await prisma.workInstruction.findUnique({
      where: { id },
      include: {
        acknowledgments: {
          where: { userId: req.user.id }
        },
        roleVisibility: {
          include: { role: true }
        }
      }
    });

    if (!wi) {
      return res.status(404).json({ error: 'Work instruction not found' });
    }

    res.json({
      id: wi.id,
      title: wi.title,
      content: wi.content,
      imageUrl: wi.imageUrl,
      isPublished: wi.isPublished,
      createdAt: wi.createdAt,
      updatedAt: wi.updatedAt,
      isAcknowledged: wi.acknowledgments.length > 0,
      permittedRoles: wi.roleVisibility.map(rv => rv.role.name)
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { title, content, isPublished, permittedRoles, imageUrlLink } = req.body;
    let imageUrl = req.file ? `/api/uploads/${req.file.filename}` : null;
    
    if (!imageUrl && imageUrlLink) {
      imageUrl = imageUrlLink;
    }

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Parse permittedRoles robustly
    let roles = [];
    if (permittedRoles) {
      try {
        roles = JSON.parse(permittedRoles);
      } catch (e) {
        if (typeof permittedRoles === 'string') {
          roles = permittedRoles.split(',').map(r => r.trim()).filter(Boolean);
        } else if (Array.isArray(permittedRoles)) {
          roles = permittedRoles;
        }
      }
    }

    const wi = await prisma.workInstruction.create({
      data: {
        title,
        content,
        imageUrl,
        isPublished: isPublished === 'true' || isPublished === true
      }
    });

    if (roles.length > 0) {
      const dbRoles = await prisma.role.findMany({ where: { name: { in: roles } } });
      if (dbRoles.length > 0) {
        await prisma.workInstructionRoleVisibility.createMany({
          data: dbRoles.map(r => ({ workInstructionId: wi.id, roleId: r.id }))
        });
      }
    }

    res.status(201).json(wi);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, isPublished, permittedRoles, imageUrlLink } = req.body;

    const existing = await prisma.workInstruction.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Work instruction not found' });
    }

    let roles = undefined;
    if (permittedRoles !== undefined) {
      try {
        roles = JSON.parse(permittedRoles);
      } catch (e) {
        if (typeof permittedRoles === 'string') {
          roles = permittedRoles.split(',').map(r => r.trim()).filter(Boolean);
        } else if (Array.isArray(permittedRoles)) {
          roles = permittedRoles;
        }
      }
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (isPublished !== undefined) {
      data.isPublished = isPublished === 'true' || isPublished === true;
    }

    if (req.file) {
      // Delete old file if exists
      if (existing.imageUrl && existing.imageUrl.startsWith('/api/uploads/')) {
        const oldPath = path.join(__dirname, '../../../uploads', path.basename(existing.imageUrl));
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) { console.error('Failed to delete old image', e); }
        }
      }
      data.imageUrl = `/api/uploads/${req.file.filename}`;
    } else if (imageUrlLink !== undefined) {
      if (existing.imageUrl && existing.imageUrl.startsWith('/api/uploads/') && imageUrlLink !== existing.imageUrl) {
        const oldPath = path.join(__dirname, '../../../uploads', path.basename(existing.imageUrl));
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) { console.error('Failed to delete old image', e); }
        }
      }
      data.imageUrl = imageUrlLink || null;
    }

    if (roles !== undefined) {
      const dbRoles = await prisma.role.findMany({ where: { name: { in: roles } } });
      data.roleVisibility = {
        deleteMany: {},
        create: dbRoles.map(r => ({ roleId: r.id }))
      };
    }

    const updated = await prisma.workInstruction.update({
      where: { id },
      data,
      include: {
        roleVisibility: { include: { role: true } }
      }
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.workInstruction.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Work instruction not found' });
    }

    // Delete file if exists
    if (existing.imageUrl) {
      const filePath = path.join(__dirname, '../../../uploads', path.basename(existing.imageUrl));
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { console.error('Failed to delete image file', e); }
      }
    }

    await prisma.workInstruction.delete({ where: { id } });
    res.json({ success: true, message: 'Work instruction deleted' });
  } catch (err) {
    next(err);
  }
};

exports.acknowledge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const wi = await prisma.workInstruction.findUnique({ where: { id } });
    if (!wi) {
      return res.status(404).json({ error: 'Work instruction not found' });
    }

    // Check if already acknowledged
    const existing = await prisma.workInstructionAcknowledgment.findUnique({
      where: {
        workInstructionId_userId: {
          workInstructionId: id,
          userId
        }
      }
    });

    if (existing) {
      return res.json({ success: true, message: 'Already acknowledged', data: existing });
    }

    const ack = await prisma.workInstructionAcknowledgment.create({
      data: {
        workInstructionId: id,
        userId
      }
    });

    res.status(201).json({ success: true, data: ack });
  } catch (err) {
    next(err);
  }
};

exports.logs = async (req, res, next) => {
  try {
    const { id } = req.params;

    const acks = await prisma.workInstructionAcknowledgment.findMany({
      where: { workInstructionId: id },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            roles: {
              include: {
                role: true
              }
            }
          }
        }
      },
      orderBy: { acknowledgedAt: 'desc' }
    });

    const logs = acks.map(ack => ({
      id: ack.id,
      acknowledgedAt: ack.acknowledgedAt,
      user: {
        fullName: ack.user.fullName,
        email: ack.user.email,
        roles: ack.user.roles.map(ur => ur.role.name)
      }
    }));

    res.json(logs);
  } catch (err) {
    next(err);
  }
};
