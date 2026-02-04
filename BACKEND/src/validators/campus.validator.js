const Joi = require('joi');
const  STATUS_MESSAGES  = require('../constants/status.messages');

const paramsSchema = Joi.object({
    campusId: Joi.string()
        .pattern(/^c[a-z0-9]{24}$/) // Regex to validate CUID v1 format
        .required()
        .messages({ 
            'string.pattern.base': '"campusId" must be a valid CUID' 
        })
});

const createCampusSchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    city: Joi.string().min(3).required(),
    colleges: Joi.array()
        .items(Joi.string().min(2).max(100))
        .optional()
        .default([])
});

const updateCampusSchema = Joi.object({
    name: Joi.string().min(3).max(100).optional(),
    city: Joi.string().min(3).optional(),
    colleges: Joi.array()
        .items(Joi.string().min(2).max(100))
        .optional()
})
.min(1);

const validate = (schema, property) => {
    return (req, res, next) => {
        
        const { error } = schema.validate(req[property], { abortEarly: false });

        if (error) {
            const { details } = error;
            const message = details.map(i => i.message).join(', ');

            console.error("Validation Error:", message);
            
            return res.status(STATUS_MESSAGES.BAD_REQUEST).json({ 
                message: "Validation failed", 
                errors: message 
            });
        }
        next();
    };
};

module.exports = {
    validate,
    paramsSchema,
    createCampusSchema,
    updateCampusSchema
};