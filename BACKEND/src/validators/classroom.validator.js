const Joi = require("joi");

const classroomTypes = ["LECTURE_HALL", "LAB"];

const createClassroomSchema = Joi.object({
    name: 
        Joi.string().min(2).max(50).required().messages({
        "string.empty": "Classroom name is required",
        "string.min": "Classroom name must be at least 2 characters long",
    }),

    capacity: Joi.number().integer().min(1).required().messages({
        "number.base": "Capacity must be a number",
        "number.min": "Capacity must be at least 1",
    }),

    type: Joi.string().valid(...classroomTypes).required().messages({
        "any.only": `Type must be one of: ${classroomTypes.join(", ")}`,
    }),

    campusName: 
        Joi.string().min(2).required().messages({
        "string.empty": "Campus name is required",
    }),
});

const getAllClassroomsSchema = Joi.object({
    campusName: Joi.string().required().messages({
        "string.empty": "Campus name is required to fetch classrooms",
    }),
});

const updateClassroomSchema = Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    capacity: Joi.number().integer().min(1).optional(),
    type: Joi.string().valid(...classroomTypes).optional(),
    campusName: Joi.string().min(2).optional(),
}).min(1); 

const classroomIdParamSchema = Joi.object({
    classroomId: Joi.string().required().messages({
        "string.empty": "Classroom ID is required",
    }),
});

const validate = (schema, property) => {
    return (req, res, next) => {
        const { error } = schema.validate(req[property], { abortEarly: false });
        if (error) {
            return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
                message: "Validation failed",
                errors: error.details.map((detail) => detail.message),
            });
        }
        next();
    };
};

module.exports = { validate, createClassroomSchema, getAllClassroomsSchema, updateClassroomSchema, classroomIdParamSchema };