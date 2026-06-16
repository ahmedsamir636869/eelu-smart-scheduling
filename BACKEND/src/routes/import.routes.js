const express = require('express');
const { importDataController, uploadMiddleware } = require('../controllers/import.controller');
const { isAuthenticated, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route   POST /api/v1/import/:category
 * @desc    Import data from Excel/CSV/JSON file
 * @access  Admin only
 * @param   category - students, physical, doctors, instructors, courses, or 'all' (imports all data types)
 * @body    FormData with 'file' (Excel/CSV/JSON) and optional 'campusId' (required for physical resources)
 */
router.post('/:category', isAuthenticated, isAdmin, uploadMiddleware, importDataController);

module.exports = router;

