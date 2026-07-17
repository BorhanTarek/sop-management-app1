const router = require('express').Router();
const ctrl = require('./mobile.controller');

// Public read-only endpoints for the mobile app (No authentication required)
router.get('/health', ctrl.checkHealth);
router.get('/categories', ctrl.getCategories);
router.get('/sops', ctrl.getSops);
router.get('/sops/:id', ctrl.getSopDetails);

module.exports = router;
