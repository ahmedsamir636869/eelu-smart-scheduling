const Joi = require('joi');
const STATUS_MESSAGES  = require('../constants/status.messages');

const cuidSchema = Joi.string()
    .pattern(/^c[a-z0-9]{24}$/)
    .required();

const cuidMessages = {
    'string.pattern.base': '"{#label}" must be a valid CUID',
};

const createCourseSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(2).max(100).required(),
    days: Joi.number().integer().min(1).max(7).required(),
    hoursPerDay: Joi.number().integer().min(1).max(24).required(),
    year: Joi.number().integer().min(1).max(4).required(),
    type: Joi.string().valid('THEORETICAL', 'PRACTICAL').required(),
    departmentId: cuidSchema.messages(cuidMessages).label('departmentId').required(),
    collegeId: cuidSchema.messages(cuidMessages).label('collegeId').required(),
    instructorId: cuidSchema.messages(cuidMessages).label('instructorId').optional().allow(null)
});

const updateCourseSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    code: Joi.string().min(2).max(100).optional(),
    days: Joi.number().integer().min(1).max(7).optional(),
    hoursPerDay: Joi.number().integer().min(1).max(24).optional(),
    year: Joi.number().integer().min(1).max(4).optional(),
    type: Joi.string().valid('THEORETICAL', 'PRACTICAL').optional(),
    departmentId: cuidSchema.messages(cuidMessages).label('departmentId').optional(),
    collegeId: cuidSchema.messages(cuidMessages).label('collegeId').optional(),
    instructorId: cuidSchema.messages(cuidMessages).label('instructorId').optional().allow(null)
}).min(1);

const paramsSchema = Joi.object({
    courseId: cuidSchema.messages(cuidMessages).label('courseId').required()
});

const validate = (schema, property) => {
    return (req, res, next) => {
        const { error } = schema.validate(req[property], { abortEarly: false });
        if (error) {
            const { details } = error;
            const message = details.map(i => i.message).join(', ');
            console.error("Validation Error:", message);
            return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
                message: "Validation failed",
            });
        }
        next();
    }
}

module.exports = { createCourseSchema, updateCourseSchema, paramsSchema, validate };