const express = require('express');
const { generateScheduleController } = require('../controllers/schedule.controller');
const { isAuthenticated, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route   POST /api/v1/schedule/generate
 * @desc    Generate schedule using AI
 * @access  Admin only
 */
router.post('/generate', isAuthenticated, isAdmin, generateScheduleController);

module.exports = router;
