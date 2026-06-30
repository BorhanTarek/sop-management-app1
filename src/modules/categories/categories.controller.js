const svc = require('./categories.service');

async function tree(req, res, next) {
  try { res.json(await svc.getTree()); } catch (err) { next(err); }
}
async function create(req, res, next) {
  try {
    const cat = await svc.create({ ...req.body, createdById: req.user.id });
    res.status(201).json(cat);
  } catch (err) { next(err); }
}
async function update(req, res, next) {
  try { res.json(await svc.update(req.params.id, req.body)); } catch (err) { next(err); }
}
async function remove(req, res, next) {
  try { await svc.remove(req.params.id); res.json({ message: 'Deleted' }); } catch (err) { next(err); }
}
async function reorder(req, res, next) {
  try { await svc.reorder(req.body.items); res.json({ message: 'Reordered' }); } catch (err) { next(err); }
}

module.exports = { tree, create, update, remove, reorder };
