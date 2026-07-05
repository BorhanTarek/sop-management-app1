const svc = require('./stations.service');

async function list(req, res, next) {
  try { res.json(await svc.getAll()); } catch (err) { next(err); }
}

async function myStations(req, res, next) {
  try { res.json(await svc.getMyStations(req.user.id)); } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try { res.json(await svc.getById(req.params.id)); } catch (err) { next(err); }
}

async function assignSop(req, res, next) {
  try {
    const { sopId, procedureType } = req.body;
    res.json(await svc.assignSop(req.params.id, sopId, procedureType));
  } catch (err) { next(err); }
}

module.exports = { list, myStations, getOne, assignSop };
