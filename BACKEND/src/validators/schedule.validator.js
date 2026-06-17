const Joi = require('joi');
const STATUS_MESSAGES = require('../constants/status.messages');

const cuidSchema = Joi.string()
  .pattern(/^c[a-z0-9]{24}$/)
  .required();

const cuidMessages = {
  'string.pattern.base': '{#label} must be a valid CUID',
};

const paramsSchema = Joi.object({
  id: cuidSchema.messages(cuidMessages).label('id'),
});

const generateScheduleSchema = Joi.object({
  campusId: cuidSchema.messages(cuidMessages).label('campusId'),
  semester: Joi.string().min(2).max(100).required(),
  scheduleType: Joi.string().valid('lectures', 'sections', 'all').optional(),
});

const validate = (schema, property) => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });

    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      console.error('Validation Error:', message);

      return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
        message: 'Validation failed',
        errors: message,
      });
    }

    next();
  };
};

module.exports = {
  paramsSchema,
  generateScheduleSchema,
  validate,
};
