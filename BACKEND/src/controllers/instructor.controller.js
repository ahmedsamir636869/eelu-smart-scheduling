const {
    createInstructor,
    getAllInstructors,
    getInstructorById,
    getInstructorByUserId,
    updateInstructor,
    deleteInstructor,
    submitAvailability,
    getMyAvailability,
    reviewAvailability
} = require('../services/instructor.service');
const STATUS_MESSAGES = require('../constants/status.messages');

const createInstructorController = async (req, res) => {
    try {
        const { name, email, departmentId, employmentType } = req.body;
        const instructor = await createInstructor(name, email, departmentId, employmentType);
        res.status(201).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Instructor created successfully',
            data: instructor
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to create instructor',
            error: error.message
        });
    }
};

const getAllInstructorsController = async (req, res) => {
    try {
        const instructors = await getAllInstructors();
        res.status(200).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Instructors fetched successfully',
            data: instructors
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to fetch instructors',
            error: error.message
        });
    }
};

const getInstructorByIdController = async (req, res) => {
    try {
        const { instructorId } = req.params;
        const instructor = await getInstructorById(instructorId);
        if (!instructor) {
            return res.status(404).json({
                status: STATUS_MESSAGES.ERROR,
                message: 'Instructor not found'
            });
        }
        res.status(200).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Instructor fetched successfully',
            data: instructor
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to fetch instructor',
            error: error.message
        });
    }
};

const updateInstructorController = async (req, res) => {
    try {
        const { instructorId } = req.params;
        const { name, email, employmentType } = req.body;
        const updatedInstructor = await updateInstructor(instructorId, name, email, employmentType);
        res.status(200).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Instructor updated successfully',
            data: updatedInstructor
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to update instructor',
            error: error.message
        });
    }
};

const deleteInstructorController = async (req, res) => {
    try {
        const { instructorId } = req.params;
        const deletedInstructor = await deleteInstructor(instructorId);
        res.status(200).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Instructor deleted successfully',
            data: deletedInstructor
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to delete instructor',
            error: error.message
        });
    }
};

// --- Availability Controllers ---

const submitAvailabilityController = async (req, res) => {
    try {
        const instructor = await getInstructorByUserId(req.user.id);
        if (!instructor) {
            return res.status(404).json({
                status: STATUS_MESSAGES.ERROR,
                message: 'Instructor profile not found for this user'
            });
        }
        const { slots } = req.body;
        const result = await submitAvailability(instructor.id, slots);
        res.status(201).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Availability submitted successfully and is pending admin approval',
            data: result
        });
    } catch (error) {
        const statusCode = error.message.includes('not required') ? 400 : 500;
        res.status(statusCode).json({
            status: STATUS_MESSAGES.ERROR,
            message: error.message
        });
    }
};

const getMyAvailabilityController = async (req, res) => {
    try {
        const instructor = await getInstructorByUserId(req.user.id);
        if (!instructor) {
            return res.status(404).json({
                status: STATUS_MESSAGES.ERROR,
                message: 'Instructor profile not found for this user'
            });
        }
        const slots = await getMyAvailability(instructor.id);
        res.status(200).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Availability fetched successfully',
            data: slots
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to fetch availability',
            error: error.message
        });
    }
};

const reviewAvailabilityController = async (req, res) => {
    try {
        const { availabilityId } = req.params;
        const { status } = req.body;
        const updated = await reviewAvailability(availabilityId, status);
        res.status(200).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: `Availability ${status.toLowerCase()} successfully`,
            data: updated
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to review availability',
            error: error.message
        });
    }
};

module.exports = {
    createInstructorController,
    getAllInstructorsController,
    getInstructorByIdController,
    updateInstructorController,
    deleteInstructorController,
    submitAvailabilityController,
    getMyAvailabilityController,
    reviewAvailabilityController
};
