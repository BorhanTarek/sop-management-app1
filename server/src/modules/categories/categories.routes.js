const router = require('express').Router();
const ctrl = require('./categories.controller');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

router.get('/', authenticate, ctrl.tree);
router.post('/', authenticate, authorize('admin', 'station_manager', 'transport_manager'), ctrl.create);
router.patch('/reorder', authenticate, authorize('admin'), ctrl.reorder);
router.patch('/:id', authenticate, authorize('admin', 'station_manager', 'transport_manager'), ctrl.update);
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);

module.exports = router;
