const { createStudentGroup, getAllStudentGroups, getStudentGroupById, updateStudentGroup, deleteStudentGroup } = require('../services/studentGroup.service');
const STATUS_MESSAGES = require('../constants/status.messages');

const createStudentGroupController = async (req, res) => {
    try {
        const { name, year, studentCount, departmentId } = req.body;
        const studentGroup = await createStudentGroup(name, year, studentCount, departmentId);
        res.status(201).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Student group created successfully',
            data: studentGroup
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to create student group',
            error: error.message
        });
    }
}

const getAllStudentGroupsController = async (req, res) => {
    try {
        const studentGroups = await getAllStudentGroups();
        res.status(200).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Student groups',
            data: studentGroups
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to fetch student groups',
            error: error.message
        });
    }
}

const getStudentGroupByIdController = async (req, res) => {
    try {
        const { studentGroupId } = req.params;
        const studentGroup = await getStudentGroupById(studentGroupId);
        res.status(200).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'This is the called student group',
            data: studentGroup
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to fetch student group',
            error: error.message
        });
    }
}

const updateStudentGroupController = async (req, res) => {
    try {
        const { studentGroupId } = req.params;
        const { name, year, studentCount } = req.body;
        const updatedStudentGroup = await updateStudentGroup(studentGroupId, name, year, studentCount);
        res.status(200).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Student group updated successfully',
            data: updatedStudentGroup
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to update student group',
            error: error.message
        });
    }
}

const deleteStudentGroupController = async (req, res) => {
    try {
        const { studentGroupId } = req.params;
        const deletedStudentGroup = await deleteStudentGroup(studentGroupId);
        res.status(200).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Student group deleted successfully',
            data: deletedStudentGroup
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to delete student group',
            error: error.message
        });
    }
}

module.exports = { createStudentGroupController, getAllStudentGroupsController, getStudentGroupByIdController, updateStudentGroupController, deleteStudentGroupController };
