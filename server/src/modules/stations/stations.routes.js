const router = require('express').Router();
const ctrl = require('./stations.controller');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

router.use(authenticate);

// All authenticated users can list stations
router.get('/', ctrl.list);
// Station master gets only their assigned stations (with today's sessions)
router.get('/my', ctrl.myStations);
// Admin can view a specific station
router.get('/:id', authorize('admin', 'station_manager', 'transport_manager'), ctrl.getOne);
// Admin assigns an SOP to a station as opening/closing procedure
router.post('/:id/assign-sop', authorize('admin'), ctrl.assignSop);

module.exports = router;
