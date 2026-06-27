const router = require('express').Router();
const { handleLogin, handleMe } = require('./auth.controller');
const { authenticate } = require('../../middleware/authenticate');

router.post('/login', handleLogin);
router.get('/me', authenticate, handleMe);

module.exports = router;
