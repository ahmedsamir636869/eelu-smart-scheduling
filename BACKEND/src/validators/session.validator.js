const Joi = require('joi');


const cuidSchema = Joi.string()
    .pattern(/^c[a-z0-9]{24}$/)
    .required();

const cuidMessages = {
    'string.pattern.base': '"{#label}" must be a valid CUID',
};

const createSessionSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    courseId: cuidSchema.messages(cuidMessages).label('courseId'),
    type: Joi.string().valid('LECTURE', 'SECTION').optional()
});

const updateSessionSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    courseId: cuidSchema.optional().messages(cuidMessages).label('courseId'),
    type: Joi.string().valid('LECTURE', 'SECTION').optional()
})
.min(1);

const paramsSchema = Joi.object({
    sessionId: cuidSchema.messages(cuidMessages).label('sessionId')
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


module.exports = { createSessionSchema, updateSessionSchema, paramsSchema, validate };
