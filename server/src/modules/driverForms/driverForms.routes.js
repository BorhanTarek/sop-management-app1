const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authenticate');
const ctrl = require('./driverForms.controller');

// All routes require authentication
router.use(authenticate);

// Driver + Admin: submit a new form
router.post('/', ctrl.submit);

// Driver (own) + Admin (all): list forms
router.get('/', ctrl.list);

// Driver (own) + Admin: get single form
router.get('/:id', ctrl.get);

// Admin only: delete a form
router.delete('/:id', ctrl.remove);

module.exports = router;
