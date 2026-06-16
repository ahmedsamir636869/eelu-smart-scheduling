const Joi = require('joi');

const cuidSchema = Joi.string()
    .pattern(/^c[a-z0-9]{24}$/)
    .required();

const cuidMessages = {
    'string.pattern.base': '"{#label}" must be a valid CUID',
};

const DAYS = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];

const createInstructorSchema = Joi.object({
    name:           Joi.string().required(),
    email:          Joi.string().email().required(),
    departmentId:   cuidSchema.messages(cuidMessages),
    employmentType: Joi.string().valid('FULL_TIME', 'PART_TIME').required()
});

const updateInstructorSchema = Joi.object({
    name:           Joi.string().optional(),
    email:          Joi.string().email().optional(),
    employmentType: Joi.string().valid('FULL_TIME', 'PART_TIME').optional()
}).min(1);

const submitAvailabilitySchema = Joi.object({
    slots: Joi.array().items(
        Joi.object({
            day:       Joi.string().valid(...DAYS).required(),
            startTime: Joi.string().isoDate().required(),
            endTime:   Joi.string().isoDate().required()
        })
    ).min(1).required()
});

const reviewAvailabilitySchema = Joi.object({
    status: Joi.string().valid('APPROVED', 'REJECTED').required()
});

const paramsSchema = Joi.object({
    instructorId: cuidSchema.messages(cuidMessages).label('instructorId')
});

const availabilityParamsSchema = Joi.object({
    availabilityId: cuidSchema.messages(cuidMessages).label('availabilityId')
});

const validate = (schema, property) => {
    return (req, res, next) => {
        const { error } = schema.validate(req[property], { abortEarly: false });
        if (error) {
            const message = error.details.map(i => i.message).join(', ');
            console.error('Validation Error:', message);
            return res.status(400).json({
                message: 'Validation failed',
                errors: message
            });
        }
        next();
    };
};

module.exports = {
    createInstructorSchema,
    updateInstructorSchema,
    submitAvailabilitySchema,
    reviewAvailabilitySchema,
    paramsSchema,
    availabilityParamsSchema,
    validate
};
