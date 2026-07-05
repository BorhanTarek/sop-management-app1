const router = require('express').Router();
const ctrl = require('./sessions.controller');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

router.use(authenticate);

// Start a new session (station_master or admin)
router.post('/', ctrl.start);
// Log a step acknowledgment
router.post('/:id/acknowledge', ctrl.acknowledge);
// Complete a session
router.post('/:id/complete', ctrl.complete);
// Get a specific session (for wizard state restoration)
router.get('/:id', ctrl.getOne);
// Admin: list all sessions (compliance dashboard)
router.get('/', authorize('admin', 'station_manager', 'transport_manager'), ctrl.list);

module.exports = router;
