const Joi = require('joi');
const STATUS_MESSAGES = require('../constants/status.messages');

const createUserSchema = Joi.object({
    FirstName: Joi.string().min(2).max(50).required().messages({
        'string.empty': 'First name is required',
        'string.min': 'First name must be at least 2 characters long'
    }),
    LastName: Joi.string().min(2).max(50).required().messages({
        'string.empty': 'Last name is required',
        'string.min': 'Last name must be at least 2 characters long'
    }),
    Email: Joi.string().email().required().messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required'
    }),
    Password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
    }),
    Role: Joi.string().valid('ADMIN', 'INSTRUCTOR', 'TA').required().messages({
        'any.only': 'Invalid role type. Must be ADMIN, INSTRUCTOR, or TA'
    }),
    employeeId: Joi.string().alphanum().optional()
});

const updateUserSchema = Joi.object({
    FirstName: Joi.string().min(2).max(50).optional(),
    LastName: Joi.string().min(2).max(50).optional(),
    Email: Joi.string().email().optional(),
    Password: Joi.string().min(6).optional(),
    Role: Joi.string().valid('ADMIN', 'INSTRUCTOR', 'TA').optional(),
    employeeId: Joi.string().alphanum().optional()
});

const userIdSchema = Joi.object({
    userId: Joi.string().required().regex(/^c[a-z0-9]{24}$/).messages({
        'string.pattern.base': 'Invalid user ID format'
    })
});

const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error } = schema.validate(req[property]);
        if (error) {
            return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
                message: 'Validation Error',
                details: error.details.map(d => d.message)
            });
        }
        next();
    };
};

module.exports = { createUserSchema, updateUserSchema, userIdSchema, validate };
