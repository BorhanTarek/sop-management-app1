const svc = require('./sops.service');

async function list(req, res, next) {
  try { res.json(await svc.getAll(req.query)); } catch (err) { next(err); }
}
async function getOne(req, res, next) {
  try { res.json(await svc.getById(req.params.id)); } catch (err) { next(err); }
}
async function create(req, res, next) {
  try { res.status(201).json(await svc.create(req.body, req.user.id)); } catch (err) { next(err); }
}
async function update(req, res, next) {
  try { res.json(await svc.update(req.params.id, req.body, req.user.id)); } catch (err) { next(err); }
}
async function publish(req, res, next) {
  try { res.json(await svc.publish(req.params.id, req.user.id)); } catch (err) { next(err); }
}
async function archive(req, res, next) {
  try { res.json(await svc.archive(req.params.id)); } catch (err) { next(err); }
}
async function restoreSop(req, res, next) {
  try { res.json(await svc.restore(req.params.id)); } catch (err) { next(err); }
}
async function remove(req, res, next) {
  try { await svc.remove(req.params.id); res.json({ message: 'Deleted' }); } catch (err) { next(err); }
}
async function versions(req, res, next) {
  try { res.json(await svc.getVersions(req.params.id)); } catch (err) { next(err); }
}
async function changelog(req, res, next) {
  try { res.json(await svc.getChangelog(req.params.id)); } catch (err) { next(err); }
}
async function restoreVersion(req, res, next) {
  try { res.json(await svc.restoreVersion(req.params.id, req.params.version, req.user.id)); } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, publish, archive, restoreSop, remove, versions, changelog, restoreVersion };
