const router = require('express').Router();
const ctrl = require('./sops.controller');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', authorize('admin', 'station_manager', 'transport_manager'), ctrl.create);
router.get('/:id', ctrl.getOne);
router.patch('/:id', authorize('admin', 'station_manager', 'transport_manager'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.remove);

router.post('/:id/publish', authorize('admin', 'station_manager', 'transport_manager'), ctrl.publish);
router.post('/:id/archive', authorize('admin', 'station_manager', 'transport_manager'), ctrl.archive);
router.post('/:id/restore', authorize('admin', 'station_manager', 'transport_manager'), ctrl.restoreSop);

router.get('/:id/versions', ctrl.versions);
router.get('/:id/changelog', ctrl.changelog);
router.post('/:id/restore/:version', authorize('admin', 'station_manager', 'transport_manager'), ctrl.restoreVersion);

router.post('/:id/steps/:stepId/acknowledge', ctrl.acknowledgeStep);

module.exports = router;
