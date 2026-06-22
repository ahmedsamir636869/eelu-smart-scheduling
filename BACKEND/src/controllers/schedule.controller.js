const { AIIntegrationService } = require('../services/ai-integration.service');
const { getScheduleById, getAllSchedules, updateScheduleStatus, deleteSchedule } = require('../services/schedule.service');
const STATUS_MESSAGES = require('../constants/status.messages');

const aiService = new AIIntegrationService();

/**
 * Generate schedule using AI
 * @route POST /api/v1/schedule/generate
 */
const generateScheduleController = async (req, res) => {
  try {
    const { campusId, semester, scheduleType } = req.body;

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

    // Service throws a 422 (with a code) when sections are requested before a
    // lectures schedule exists; surface it so the frontend can guide the user.
    const statusCode = error.status || STATUS_MESSAGES.INTERNAL_SERVER_ERROR;
    const isExpected = statusCode !== STATUS_MESSAGES.INTERNAL_SERVER_ERROR;

    return res.status(statusCode).json({
      success: false,
      message: isExpected ? error.message : 'Failed to generate schedule',
      code: error.code,
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
    const { campusId, semester } = req.query;
    const schedules = await getAllSchedules({ campusId, semester });

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

const updateScheduleStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!id || !status) {
      return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
        success: false,
        message: 'Schedule ID and status are required'
      });
    }

    const updatedSchedule = await updateScheduleStatus(id, status);

    return res.status(STATUS_MESSAGES.OK).json({
      success: true,
      message: 'Schedule status updated successfully',
      schedule: updatedSchedule
    });
  } catch (error) {
    console.error('❌ Error updating schedule status:', error.message);
    return res.status(STATUS_MESSAGES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update schedule status',
      error: error.message
    });
  }
};

const deleteScheduleController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
        success: false,
        message: 'Schedule ID is required'
      });
    }

    await deleteSchedule(id);

    return res.status(STATUS_MESSAGES.OK).json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting schedule:', error.message);
    return res.status(STATUS_MESSAGES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete schedule',
      error: error.message
    });
  }
};

module.exports = {
  generateScheduleController,
  getScheduleByIdController,
  getAllSchedulesController,
  updateScheduleStatusController,
  deleteScheduleController
};
