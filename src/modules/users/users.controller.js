const svc = require('./users.service');

const clean = (user) => {
  const { passwordHash, ...rest } = user;
  return { ...rest, roles: rest.roles?.map((ur) => ur.role?.name || ur) };
};

async function list(req, res, next) {
  try {
    const users = await svc.getAll(req.query);
    res.json(users.map(clean));
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    res.json(clean(await svc.getById(req.params.id)));
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const user = await svc.create(req.body);
    res.status(201).json(clean(user));
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const user = await svc.update(req.params.id, req.body);
    res.json(clean(user));
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await svc.remove(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove };
