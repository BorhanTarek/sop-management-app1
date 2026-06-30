const router = require('express').Router();
const ctrl = require('./sops.controller');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', authorize('admin', 'editor'), ctrl.create);
router.get('/:id', ctrl.getOne);
router.patch('/:id', authorize('admin', 'editor'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.remove);

router.post('/:id/publish', authorize('admin', 'editor'), ctrl.publish);
router.post('/:id/archive', authorize('admin', 'editor'), ctrl.archive);
router.post('/:id/restore', authorize('admin', 'editor'), ctrl.restoreSop);

router.get('/:id/versions', ctrl.versions);
router.get('/:id/changelog', ctrl.changelog);
router.post('/:id/restore/:version', authorize('admin', 'editor'), ctrl.restoreVersion);

module.exports = router;
