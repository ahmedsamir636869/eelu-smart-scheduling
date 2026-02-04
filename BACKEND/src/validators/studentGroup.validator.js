const Joi = require('joi');

const cuidSchema = Joi.string()
    .pattern(/^c[a-z0-9]{24}$/)
    .required();

const cuidMessages = {
    'string.pattern.base': '"{#label}" must be a valid CUID',
};


const createStudentGroupSchema = Joi.object({
    name: Joi.string().required(),
    year: Joi.number().required(),
    studentCount: Joi.number().required(),
    departmentId: cuidSchema.messages(cuidMessages)
});

const updateStudentGroupSchema = Joi.object({
    name: Joi.string(),
    year: Joi.number(),
    studentCount: Joi.number(),
});

const paramsSchema = Joi.object({
    studentGroupId: cuidSchema.messages(cuidMessages).label('studentGroupId')
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

module.exports = { createStudentGroupSchema, updateStudentGroupSchema, paramsSchema, validate };
