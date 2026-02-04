const Joi = require('joi');


const cuidSchema = Joi.string()
    .pattern(/^c[a-z0-9]{24}$/)
    .required();

const cuidMessages = {
    'string.pattern.base': '"{#label}" must be a valid CUID',
};

const createDepartmentSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(2).max(10).uppercase().required(),
    collegeId: cuidSchema.messages(cuidMessages).label('collegeId')
});

const updateDepartmentSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    code: Joi.string().min(2).max(10).uppercase().optional(),
    collegeId: cuidSchema.optional().messages(cuidMessages).label('collegeId') 
})
.min(1);

const paramsForGetAllSchema = Joi.object({
    collegeId: cuidSchema.messages(cuidMessages).label('collegeId')
});

const paramsForSingleDepartmentSchema = Joi.object({
    departmentId: cuidSchema.messages(cuidMessages).label('departmentId')
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

module.exports = {validate, createDepartmentSchema, updateDepartmentSchema, paramsForGetAllSchema, paramsForSingleDepartmentSchema};