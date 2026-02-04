const { AIIntegrationService } = require('../services/ai-integration.service');
const STATUS_MESSAGES = require('../constants/status.messages');

const aiService = new AIIntegrationService();

/**
 * Generate schedule using AI
 * @route POST /api/v1/schedule/generate
 */
const generateScheduleController = async (req, res) => {
  try {
    const { campusId, semester } = req.body;

    // Validation
    if (!campusId || !semester) {
      return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
        success: false,
        message: 'campusId and semester are required'
      });
    }

    console.log('📥 Received schedule generation request');
    console.log('Campus ID:', campusId);
    console.log('Semester:', semester);

    // Generate schedule using AI
    const schedule = await aiService.generateSchedule(campusId, semester);

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

module.exports = {
  generateScheduleController
};
