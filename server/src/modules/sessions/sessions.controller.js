const svc = require('./sessions.service');

async function start(req, res, next) {
  try {
    const { stationId, procedureType } = req.body;
    res.status(201).json(await svc.startSession(req.user.id, stationId, procedureType));
  } catch (err) { next(err); }
}

async function acknowledge(req, res, next) {
  try {
    const { stepId, stepTitle, stepType, branchChoice } = req.body;
    res.status(201).json(
      await svc.acknowledgeStep(req.params.id, req.user.id, stepId, stepTitle, stepType, branchChoice)
    );
  } catch (err) { next(err); }
}

async function complete(req, res, next) {
  try {
    res.json(await svc.completeSession(req.params.id, req.user.id));
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    res.json(await svc.getSession(req.params.id, req.user.id));
  } catch (err) { next(err); }
}

async function list(req, res, next) {
  try {
    res.json(await svc.listSessions(req.query));
  } catch (err) { next(err); }
}

module.exports = { start, acknowledge, complete, getOne, list };
