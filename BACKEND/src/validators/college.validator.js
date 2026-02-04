const Joi = require('joi');
const STATUS_MESSAGES  = require('../constants/status.messages');

const cuidSchema = Joi.string()
    .pattern(/^c[a-z0-9]{24}$/)
    .required();

const cuidMessages = {
    'string.pattern.base': '"{#label}" must be a valid CUID',
};

const createCollegeSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    campusId: cuidSchema.messages(cuidMessages).label('campusId')
});

const updateCollegeSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    campusId: cuidSchema.optional().messages(cuidMessages).label('campusId')
})
.min(1);

const paramsForGetAllSchema = Joi.object({
    campusId: cuidSchema.messages(cuidMessages).label('campusId')
});

const paramsForSingleCollegeSchema = Joi.object({
    collegeId: cuidSchema.messages(cuidMessages).label('collegeId')
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
                errors: message 
            });
        }
        next();
    };
};

module.exports = {
    validate,
    paramsForGetAllSchema,
    paramsForSingleCollegeSchema,
    createCollegeSchema,
    updateCollegeSchema
};