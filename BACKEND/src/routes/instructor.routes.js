const express = require('express');
const router = express.Router();
const { createInstructorController, getAllInstructorsController, getInstructorByIdController, updateInstructorController, deleteInstructorController } = require('../controllers/instructor.controller');
const { validate, createInstructorSchema, updateInstructorSchema, paramsSchema } = require('../validators/instructor.validator');
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

router.get('/', isAuthenticated, getAllInstructorsController);
router.get('/:instructorId', isAuthenticated, validate(paramsSchema, 'params'), getInstructorByIdController);

router.post('/', isAuthenticated, isAdmin, validate(createInstructorSchema, 'body'), createInstructorController);
router.put('/:instructorId', isAuthenticated, isAdmin, validate(paramsSchema, 'params'), validate(updateInstructorSchema, 'body'), updateInstructorController);
router.delete('/:instructorId', isAuthenticated, isAdmin, validate(paramsSchema, 'params'), deleteInstructorController);

module.exports = router;