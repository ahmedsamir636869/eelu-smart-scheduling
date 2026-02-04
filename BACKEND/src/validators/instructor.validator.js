const Joi = require('joi');

const cuidSchema = Joi.string()
    .pattern(/^c[a-z0-9]{24}$/)
    .required();

const cuidMessages = {
    'string.pattern.base': '"{#label}" must be a valid CUID',
};

const createInstructorSchema = Joi.object({
    name: Joi.string().required(),
    departmentId: cuidSchema.messages(cuidMessages),
    day: Joi.string().required(),
    startTime: Joi.string().required(),
    endTime: Joi.string().required()
});

const updateInstructorSchema = Joi.object({
    name: Joi.string().required(),
    day: Joi.string().required(),
    startTime: Joi.string().required(),
    endTime: Joi.string().required()
});

const paramsSchema = Joi.object({
    instructorId: cuidSchema.messages(cuidMessages).label('instructorId')
});

const validate = (schema, property) => {
    return (req, res, next) => {
        
        const { error } = schema.validate(req[property], { abortEarly: false });

        if (error) {
            const { details } = error;
            const message = details.map(i => i.message).join(', ');

            console.error("Validation Error:", message);
            
            return res.status(400).json({ 
                message: "Validation failed", 
                errors: message 
            });
        }
        next();
    };
};

module.exports = { createInstructorSchema, updateInstructorSchema, paramsSchema, validate };
