const { AIIntegrationService } = require('../services/ai-integration.service');
const { getScheduleById, getAllSchedules } = require('../services/schedule.service');
const STATUS_MESSAGES = require('../constants/status.messages');

const aiService = new AIIntegrationService();

/**
 * Generate schedule using AI
 * @route POST /api/v1/schedule/generate
 */
const generateScheduleController = async (req, res) => {
  try {
    const { campusId, semester, scheduleType } = req.body;

    // Validation
    if (!campusId || !semester) {
      return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
        success: false,
        message: 'campusId and semester are required'
      });
    }

    // Validate scheduleType if provided
    if (scheduleType && !['lectures', 'sections', 'all'].includes(scheduleType)) {
      return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
        success: false,
        message: 'scheduleType must be "lectures", "sections", or "all"'
      });
    }

    console.log('📥 Received schedule generation request');
    console.log('Campus ID:', campusId);
    console.log('Semester:', semester);
    console.log('Schedule Type:', scheduleType || 'all');

    // Generate schedule using AI
    const schedule = await aiService.generateSchedule(campusId, semester, scheduleType || 'all');

    return res.status(STATUS_MESSAGES.CREATED).json({
      success: true,
      message: 'Schedule generated successfully',
      schedule: schedule
    });
  } catch (error) {
    console.error('❌ Error generating schedule:', error.message);

    return res.status(STATUS_MESSAGES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to generate schedule',
      error: error.message
    });
  }
};

/**
 * Get schedule by ID
 * @route GET /api/v1/schedule/:id
 */
const getScheduleByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
        success: false,
        message: 'Schedule ID is required'
      });
    }

    const schedule = await getScheduleById(id);

    return res.status(STATUS_MESSAGES.OK).json({
      success: true,
      schedule: schedule
    });
  } catch (error) {
    console.error('❌ Error fetching schedule:', error.message);

    return res.status(STATUS_MESSAGES.NOT_FOUND).json({
      success: false,
      message: 'Failed to fetch schedule',
      error: error.message
    });
  }
};

/**
 * Get all schedules
 * @route GET /api/v1/schedule
 */
const getAllSchedulesController = async (req, res) => {
  try {
    const schedules = await getAllSchedules();

    return res.status(STATUS_MESSAGES.OK).json({
      success: true,
      schedules: schedules
    });
  } catch (error) {
    console.error('❌ Error fetching schedules:', error.message);

    return res.status(STATUS_MESSAGES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch schedules',
      error: error.message
    });
  }
};

module.exports = {
  generateScheduleController,
  getScheduleByIdController,
  getAllSchedulesController
};
