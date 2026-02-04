const { createInstructor, getAllInstructors, getInstructorById, updateInstructor, deleteInstructor } = require('../services/instructor.service');
const STATUS_MESSAGES = require('../constants/status.messages');

const createInstructorController = async (req, res) => {
    try {
        const { name, type, departmentId, day, startTime, endTime, weeklyHours } = req.body;
        const instructor = await createInstructor(name, type, departmentId, day, startTime, endTime, weeklyHours);
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
}

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
}

const getInstructorByIdController = async (req, res) => {
    try {
        const { instructorId } = req.params;
        const instructor = await getInstructorById(instructorId);
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
}

const updateInstructorController = async (req, res) => {
    try {
        const { instructorId } = req.params;
        const { name, type, day, startTime, endTime, weeklyHours } = req.body;
        const updatedInstructor = await updateInstructor(instructorId, name, type, day, startTime, endTime, weeklyHours);
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
}

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
}

module.exports = { createInstructorController, getAllInstructorsController, getInstructorByIdController, updateInstructorController, deleteInstructorController };