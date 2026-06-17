const Joi = require('joi');

const cuidSchema = Joi.string()
    .pattern(/^c[a-z0-9]{24}$/)
    .required();

const cuidMessages = {
    'string.pattern.base': '{#label} must be a valid CUID'
};

const DAYS = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];

const createTASchema = Joi.object({
    name:         Joi.string().required(),
    email:        Joi.string().email().required(),
    departmentId: cuidSchema.messages(cuidMessages),
    isExpatriate: Joi.boolean().optional()
});

const updateTASchema = Joi.object({
    name:         Joi.string().optional(),
    email:        Joi.string().email().optional(),
    isExpatriate: Joi.boolean().optional()
}).min(1);

const setOffDaysSchema = Joi.object({
    days: Joi.array()
        .items(Joi.string().valid(...DAYS))
        .unique()
        .required()
});

const submitReportSchema = Joi.object({
    title:   Joi.string().min(3).max(200).required(),
    content: Joi.string().min(10).required()
});

const taParamsSchema = Joi.object({
    taId: cuidSchema.messages(cuidMessages).label('taId')
});

const reportParamsSchema = Joi.object({
    reportId: cuidSchema.messages(cuidMessages).label('reportId')
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
    createTASchema,
    updateTASchema,
    submitReportSchema,
    setOffDaysSchema,
    taParamsSchema,
    reportParamsSchema,
    validate
};
