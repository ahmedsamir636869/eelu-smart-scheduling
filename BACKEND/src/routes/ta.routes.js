const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/ta.controller');
const {
    validate,
    createTASchema,
    updateTASchema,
    submitReportSchema,
    setOffDaysSchema,
    taParamsSchema,
    reportParamsSchema
} = require('../validators/ta.validator');
const { isAuthenticated, isAdmin, isTA } = require('../middleware/auth.middleware');

// --- TA CRUD (Admin only for write operations) ---
router.get('/',        isAuthenticated,           getAllTAsController);
router.get('/:taId',   isAuthenticated, validate(taParamsSchema, 'params'), getTAByIdController);
router.post('/',       isAuthenticated, isAdmin,   validate(createTASchema, 'body'),  createTAController);
router.put('/:taId',   isAuthenticated, isAdmin,   validate(taParamsSchema, 'params'), validate(updateTASchema, 'body'), updateTAController);
router.delete('/:taId',isAuthenticated, isAdmin,   validate(taParamsSchema, 'params'), deleteTAController);

// --- Off Days (Admin manages) ---
router.put('/:taId/off-days', isAuthenticated, isAdmin, validate(taParamsSchema, 'params'), validate(setOffDaysSchema, 'body'), setOffDaysController);
router.get('/:taId/off-days', isAuthenticated,          validate(taParamsSchema, 'params'), getOffDaysController);

// --- Reports ---
router.post('/reports',          isAuthenticated, isTA,   validate(submitReportSchema, 'body'), submitReportController);
router.get('/reports/me',        isAuthenticated, isTA,   getMyReportsController);
router.get('/reports',           isAuthenticated, isAdmin, getAllReportsController);
router.patch('/reports/:reportId/read', isAuthenticated, isAdmin, validate(reportParamsSchema, 'params'), markReportReadController);

module.exports = router;
