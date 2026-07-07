const router = require('express').Router();
const ctrl = require('./sessions.controller');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

router.use(authenticate);

// Start a new session (station_master or admin)
router.post('/', ctrl.start);
// Start a viewer-portal session (any authenticated user, no station required)
router.post('/viewer-session', ctrl.startViewer);
// Log a step acknowledgment
router.post('/:id/acknowledge', ctrl.acknowledge);
// Complete a session
router.post('/:id/complete', ctrl.complete);

// Admin: list all sessions (compliance dashboard)
router.get('/', authorize('admin', 'station_manager', 'transport_manager'), ctrl.list);
// Admin: detailed wizard step-by-step SOPs log viewer — MUST be before /:id to avoid shadowing
router.get('/sop-logs', authorize('admin', 'station_manager', 'transport_manager'), ctrl.sopLogs);
// Get a specific session (for wizard state restoration)
router.get('/:id', ctrl.getOne);

module.exports = router;
