const prisma = require('../../config/db');

async function getCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // Build tree
    const categoryMap = new Map();
    categories.forEach(c => categoryMap.set(c.id, { ...c, children: [] }));

    const tree = [];
    categories.forEach(c => {
      if (c.parentId) {
        const parent = categoryMap.get(c.parentId);
        if (parent) {
          parent.children.push(categoryMap.get(c.id));
        }
      } else {
        tree.push(categoryMap.get(c.id));
      }
    });

    res.json(tree);
  } catch (err) {
    next(err);
  }
}

async function getSops(req, res, next) {
  try {
    const { categoryId, search } = req.query;

    const whereClause = {
      status: 'published'
    };

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (search) {
      whereClause.title = { contains: search };
    }

    const sops = await prisma.sop.findMany({
      where: whereClause,
      include: {
        category: true,
        owner: { select: { fullName: true } }
      },
      orderBy: { id: 'desc' }
    });

    res.json({ sops, total: sops.length });
  } catch (err) {
    next(err);
  }
}

async function getSopDetails(req, res, next) {
  try {
    const id = req.params.id;
    const sop = await prisma.sop.findUnique({
      where: { id },
      include: {
        category: true,
        owner: { select: { fullName: true } }
      }
    });

    if (!sop) {
      return res.status(404).json({ error: 'SOP not found' });
    }

    // Get current version's steps
    const currentVersion = await prisma.sopVersion.findFirst({
      where: { sopId: id, isCurrent: true }
    });

    let steps = [];
    if (currentVersion) {
      steps = await prisma.sopStep.findMany({
        where: { versionId: currentVersion.id },
        orderBy: { sortOrder: 'asc' }
      });
      // Parse JSON fields
      steps = steps.map(s => {
        let attentionPoints = [];
        let safetyPoints = [];
        try {
          attentionPoints = s.attentionPoints ? JSON.parse(s.attentionPoints) : [];
        } catch(e){}
        try {
          safetyPoints = s.safetyPoints ? JSON.parse(s.safetyPoints) : [];
        } catch(e){}
        return {
          ...s,
          attentionPoints,
          safetyPoints
        };
      });
    }

    res.json({ ...sop, steps });
  } catch (err) {
    next(err);
  }
}

async function checkHealth(req, res) {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
}

module.exports = {
  getCategories,
  getSops,
  getSopDetails,
  checkHealth
};
