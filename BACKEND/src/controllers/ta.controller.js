const {
    createTA,
    getAllTAs,
    getTAById,
    getTAByUserId,
    updateTA,
    deleteTA,
    submitReport,
    getMyReports,
    getAllReports,
    markReportRead,
    setOffDays,
    getOffDays
} = require('../services/ta.service');
const STATUS_MESSAGES = require('../constants/status.messages');

// --- TA CRUD ---

const createTAController = async (req, res) => {
    try {
        const { name, email, departmentId, isExpatriate } = req.body;
        const ta = await createTA(name, email, departmentId, isExpatriate);
        res.status(201).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'TA created successfully',
            data: ta
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to create TA',
            error: error.message
        });
    }
};

const getAllTAsController = async (req, res) => {
    try {
        const tas = await getAllTAs();
        res.status(200).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'TAs fetched successfully',
            data: tas
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to fetch TAs',
            error: error.message
        });
    }
};

const getTAByIdController = async (req, res) => {
    try {
        const { taId } = req.params;
        const ta = await getTAById(taId);
        if (!ta) {
            return res.status(404).json({
                status: STATUS_MESSAGES.ERROR,
                message: 'TA not found'
            });
        }
        res.status(200).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'TA fetched successfully',
            data: ta
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to fetch TA',
            error: error.message
        });
    }
};

const updateTAController = async (req, res) => {
    try {
        const { taId } = req.params;
        const { name, email, isExpatriate } = req.body;
        const updatedTA = await updateTA(taId, name, email, isExpatriate);
        res.status(200).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'TA updated successfully',
            data: updatedTA
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to update TA',
            error: error.message
        });
    }
};

const deleteTAController = async (req, res) => {
    try {
        const { taId } = req.params;
        const deletedTA = await deleteTA(taId);
        res.status(200).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'TA deleted successfully',
            data: deletedTA
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to delete TA',
            error: error.message
        });
    }
};

// --- Report Controllers ---

const submitReportController = async (req, res) => {
    try {
        const ta = await getTAByUserId(req.user.id);
        if (!ta) {
            return res.status(404).json({
                status: STATUS_MESSAGES.ERROR,
                message: 'TA profile not found for this user'
            });
        }
        const { title, content } = req.body;
        const report = await submitReport(ta.id, title, content);
        res.status(201).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Report submitted successfully',
            data: report
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to submit report',
            error: error.message
        });
    }
};

const getMyReportsController = async (req, res) => {
    try {
        const ta = await getTAByUserId(req.user.id);
        if (!ta) {
            return res.status(404).json({
                status: STATUS_MESSAGES.ERROR,
                message: 'TA profile not found for this user'
            });
        }
        const reports = await getMyReports(ta.id);
        res.status(200).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Reports fetched successfully',
            data: reports
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to fetch reports',
            error: error.message
        });
    }
};

const getAllReportsController = async (req, res) => {
    try {
        const reports = await getAllReports();
        res.status(200).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'All reports fetched successfully',
            data: reports
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to fetch reports',
            error: error.message
        });
    }
};

const markReportReadController = async (req, res) => {
    try {
        const { reportId } = req.params;
        const updated = await markReportRead(reportId);
        res.status(200).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Report marked as read',
            data: updated
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to mark report as read',
            error: error.message
        });
    }
};

const setOffDaysController = async (req, res) => {
    try {
        const { taId } = req.params;
        const { days } = req.body;
        const offDays = await setOffDays(taId, days);
        res.status(200).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Off days updated successfully',
            data: offDays
        });
    } catch (error) {
        const statusCode = error.message === 'TA not found' ? 404 : 500;
        res.status(statusCode).json({
            status: STATUS_MESSAGES.ERROR,
            message: error.message
        });
    }
};

const getOffDaysController = async (req, res) => {
    try {
        const { taId } = req.params;
        const offDays = await getOffDays(taId);
        res.status(200).json({
            status: STATUS_MESSAGES.SUCCESS,
            message: 'Off days fetched successfully',
            data: offDays
        });
    } catch (error) {
        res.status(500).json({
            status: STATUS_MESSAGES.ERROR,
            message: 'Failed to fetch off days',
            error: error.message
        });
    }
};

module.exports = {
    createTAController,
    getAllTAsController,
    getTAByIdController,
    updateTAController,
    deleteTAController,
    submitReportController,
    getMyReportsController,
    getAllReportsController,
    markReportReadController,
    setOffDaysController,
    getOffDaysController
};
