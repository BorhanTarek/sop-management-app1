const { login } = require('./auth.service');

async function handleLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function handleMe(req, res) {
  res.json({ user: req.user });
}

module.exports = { handleLogin, handleMe };
