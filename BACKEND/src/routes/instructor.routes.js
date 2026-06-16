const express = require('express');
const router = express.Router();
const {
    createInstructorController,
    getAllInstructorsController,
    getInstructorByIdController,
    updateInstructorController,
    deleteInstructorController,
    submitAvailabilityController,
    getMyAvailabilityController,
    reviewAvailabilityController
} = require('../controllers/instructor.controller');
const {
    validate,
    createInstructorSchema,
    updateInstructorSchema,
    submitAvailabilitySchema,
    reviewAvailabilitySchema,
    paramsSchema,
    availabilityParamsSchema
} = require('../validators/instructor.validator');
const { isAuthenticated, isAdmin, isInstructor } = require('../middleware/auth.middleware');

// --- CRUD (Admin only for write operations) ---
router.get('/',                isAuthenticated,            getAllInstructorsController);
router.get('/:instructorId',   isAuthenticated, validate(paramsSchema, 'params'), getInstructorByIdController);
router.post('/',               isAuthenticated, isAdmin,   validate(createInstructorSchema, 'body'),  createInstructorController);
router.put('/:instructorId',   isAuthenticated, isAdmin,   validate(paramsSchema, 'params'), validate(updateInstructorSchema, 'body'), updateInstructorController);
router.delete('/:instructorId',isAuthenticated, isAdmin,   validate(paramsSchema, 'params'), deleteInstructorController);

// --- Availability (Part-time instructors submit, admin reviews) ---
router.post('/availability',                         isAuthenticated, isInstructor, validate(submitAvailabilitySchema, 'body'),         submitAvailabilityController);
router.get('/availability/me',                       isAuthenticated, isInstructor,                                                      getMyAvailabilityController);
router.patch('/availability/:availabilityId/review', isAuthenticated, isAdmin,      validate(availabilityParamsSchema, 'params'), validate(reviewAvailabilitySchema, 'body'), reviewAvailabilityController);

module.exports = router;
