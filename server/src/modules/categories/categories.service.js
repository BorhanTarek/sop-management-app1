const prisma = require('../../config/db');

function slugify(text) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

async function getTree() {
  const all = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { sops: true } } },
  });

  const map = {};
  all.forEach((c) => { map[c.id] = { ...c, children: [] }; });
  const roots = [];
  all.forEach((c) => {
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].children.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });
  return roots;
}

async function getById(id) {
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) throw Object.assign(new Error('Category not found'), { status: 404 });
  return cat;
}

async function create({ name, description, icon, parentId, sortOrder, createdById }) {
  const slug = slugify(name) + '-' + Date.now();

  // Validate createdById exists (guards against stale JWT after DB re-seed)
  let safeCreatedById = null;
  if (createdById) {
    const userExists = await prisma.user.findUnique({ where: { id: createdById }, select: { id: true } });
    safeCreatedById = userExists ? createdById : null;
  }

  // Validate parentId exists if provided
  let safeParentId = null;
  if (parentId) {
    const parentExists = await prisma.category.findUnique({ where: { id: parentId }, select: { id: true } });
    safeParentId = parentExists ? parentId : null;
  }

  return prisma.category.create({
    data: { name, slug, description, icon, parentId: safeParentId, sortOrder: sortOrder || 0, createdById: safeCreatedById },
  });
}

async function update(id, data) {
  await getById(id);
  return prisma.category.update({ where: { id }, data });
}

async function remove(id) {
  await getById(id);
  // Move children to parent's parent before deleting
  const cat = await prisma.category.findUnique({ where: { id } });
  await prisma.category.updateMany({ where: { parentId: id }, data: { parentId: cat.parentId } });
  return prisma.category.delete({ where: { id } });
}

async function reorder(items) {
  const updates = items.map(({ id, sortOrder }) =>
    prisma.category.update({ where: { id }, data: { sortOrder } })
  );
  return Promise.all(updates);
}

module.exports = { getTree, getById, create, update, remove, reorder };
