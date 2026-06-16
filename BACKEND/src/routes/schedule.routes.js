const express = require('express');
const { 
  generateScheduleController, 
  getScheduleByIdController,
  getAllSchedulesController 
} = require('../controllers/schedule.controller');
const { isAuthenticated, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route   GET /api/v1/schedule
 * @desc    Get all schedules
 * @access  Authenticated
 */
router.get('/', isAuthenticated, getAllSchedulesController);

/**
 * @route   GET /api/v1/schedule/:id
 * @desc    Get schedule by ID
 * @access  Authenticated
 */
router.get('/:id', isAuthenticated, getScheduleByIdController);

/**
 * @route   POST /api/v1/schedule/generate
 * @desc    Generate schedule using AI
 * @access  Admin only
 */
router.post('/generate', isAuthenticated, isAdmin, generateScheduleController);

module.exports = router;
