const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklist.controller');
const { auth, requireRole } = require('../middleware/auth.middleware');

// Public to authenticated users (Station Masters)
router.get('/tasks', auth, checklistController.getTasks);
router.post('/submit', auth, checklistController.submitChecklist);

// Admin / Managers only
const adminOnly = [auth, requireRole(['admin', 'transport_manager', 'station_manager'])];
router.get('/tasks/all', ...adminOnly, checklistController.getAllTasks);
router.post('/tasks', ...adminOnly, checklistController.createTask);
router.put('/tasks/:id', ...adminOnly, checklistController.updateTask);
router.delete('/tasks/:id', ...adminOnly, checklistController.deleteTask);
router.get('/logs', ...adminOnly, checklistController.getLogs);

module.exports = router;
