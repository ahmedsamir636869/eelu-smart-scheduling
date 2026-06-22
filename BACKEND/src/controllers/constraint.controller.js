const { getAllConstraints, createConstraint, updateConstraint, deleteConstraint } = require('../services/constraint.service');
const STATUS_MESSAGES = require('../constants/status.messages');

const getAllConstraintsController = async (req, res) => {
    try {
        const constraints = await getAllConstraints();
        res.status(STATUS_MESSAGES.OK).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Constraints fetched successfully',
            data: constraints
        });
    } catch (error) {
        res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to fetch constraints',
            error: error.message
        });
    }
};

const createConstraintController = async (req, res) => {
    try {
        const constraint = await createConstraint(req.body);
        res.status(STATUS_MESSAGES.CREATED).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Constraint created successfully',
            data: constraint
        });
    } catch (error) {
        res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to create constraint',
            error: error.message
        });
    }
};

const updateConstraintController = async (req, res) => {
    try {
        const { id } = req.params;
        const constraint = await updateConstraint(id, req.body);
        res.status(STATUS_MESSAGES.OK).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Constraint updated successfully',
            data: constraint
        });
    } catch (error) {
        res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to update constraint',
            error: error.message
        });
    }
};

const deleteConstraintController = async (req, res) => {
    try {
        const { id } = req.params;
        const constraint = await deleteConstraint(id);
        res.status(STATUS_MESSAGES.OK).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Constraint deleted successfully',
            data: constraint
        });
    } catch (error) {
        res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to delete constraint',
            error: error.message
        });
    }
};

module.exports = {
    getAllConstraintsController,
    createConstraintController,
    updateConstraintController,
    deleteConstraintController
};
