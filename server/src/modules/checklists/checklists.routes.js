const express = require('express');
const router = express.Router();
const checklistController = require('./checklists.controller');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

router.use(authenticate);

// Public to authenticated users (Station Masters)
router.get('/tasks', checklistController.getTasks);
router.post('/submit', checklistController.submitChecklist);

// Admin / Managers only
const adminOnly = authorize('admin', 'transport_manager', 'station_manager');
router.get('/tasks/all', adminOnly, checklistController.getAllTasks);
router.post('/tasks', adminOnly, checklistController.createTask);
router.put('/tasks/:id', adminOnly, checklistController.updateTask);
router.delete('/tasks/:id', adminOnly, checklistController.deleteTask);
router.get('/logs', adminOnly, checklistController.getLogs);

module.exports = router;
