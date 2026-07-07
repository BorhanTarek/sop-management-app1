const router = require('express').Router();
const ctrl = require('./users.controller');
const sigCtrl = require('./users.signature.controller');
const onboardingCtrl = require('./users.onboarding.controller');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

router.use(authenticate);

// Self-service signature and onboarding endpoints — any authenticated user
router.get('/me/signature', sigCtrl.getMySignature);
router.post('/me/signature', sigCtrl.saveMySignature);
router.post('/me/onboarding', onboardingCtrl.saveOnboarding);

// Admin-only user management
router.get('/', authorize('admin'), ctrl.list);
router.post('/', authorize('admin'), ctrl.create);
router.get('/:id', authorize('admin'), ctrl.getOne);
router.patch('/:id', authorize('admin'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.remove);

module.exports = router;
