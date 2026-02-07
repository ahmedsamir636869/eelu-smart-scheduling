const multer = require('multer');
const { parseExcelToJSON, importStudentGroups, importPhysicalResources, importInstructors, importCourses, importAllData } = require('../services/import.service');
const STATUS_MESSAGES = require('../constants/status.messages');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/json' // .json
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls') || file.originalname.endsWith('.csv') || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel (.xlsx, .xls), CSV (.csv), and JSON (.json) files are allowed.'));
    }
  }
});

const uploadMiddleware = upload.single('file');

/**
 * Import data from uploaded file
 * @route POST /api/v1/import/:category
 */
const importDataController = async (req, res) => {
  try {
    const { category } = req.params;
    // Get campusId from body (FormData sends it as req.body.campusId)
    const campusId = req.body?.campusId || null;
    
    console.log('Import request details:', {
      category,
      campusId,
      bodyKeys: Object.keys(req.body || {}),
      hasFile: !!req.file
    });
    
    if (!req.file) {
      return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    if (!['students', 'physical', 'doctors', 'instructors', 'courses', 'all'].includes(category)) {
      return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
        success: false,
        message: 'Invalid category. Must be one of: students, physical, doctors, instructors, courses, all'
      });
    }

    let jsonData;
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;

    // Parse file based on type
    if (fileName.endsWith('.json')) {
      try {
        jsonData = JSON.parse(fileBuffer.toString('utf-8'));
        if (!Array.isArray(jsonData)) {
          jsonData = [jsonData];
        }
      } catch (error) {
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
          success: false,
          message: 'Invalid JSON file',
          error: error.message
        });
      }
    } else {
      // Parse Excel/CSV
      try {
        jsonData = parseExcelToJSON(fileBuffer);
      } catch (error) {
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
          success: false,
          message: 'Failed to parse file',
          error: error.message
        });
      }
    }

    if (!jsonData || jsonData.length === 0) {
      return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
        success: false,
        message: 'File is empty or contains no data'
      });
    }

    // Import based on category
    let results;
    switch (category) {
      case 'students':
        results = await importStudentGroups(jsonData, campusId);
        break;
      case 'physical':
        if (!campusId) {
          return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            success: false,
            message: 'Campus ID is required for importing physical resources'
          });
        }
        results = await importPhysicalResources(jsonData, campusId);
        break;
      case 'doctors':
      case 'instructors':
        results = await importInstructors(jsonData, campusId);
        break;
      case 'courses':
        results = await importCourses(jsonData, campusId);
        break;
      case 'all':
        results = await importAllData(jsonData, campusId);
        break;
      default:
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
          success: false,
          message: 'Invalid category'
        });
    }

    // Format response based on category
    if (category === 'all') {
      return res.status(STATUS_MESSAGES.OK).json({
        success: true,
        message: `Import completed: ${results.summary.successful} successful, ${results.summary.errors} errors`,
        data: {
          total: results.summary.total,
          successful: results.summary.successful,
          errors: results.summary.errors,
          unknown: results.summary.unknown,
          breakdown: results.summary.breakdown,
          details: {
            students: {
              success: results.students.success,
              errors: results.students.errors
            },
            physical: {
              success: results.physical.success,
              errors: results.physical.errors
            },
            instructors: {
              success: results.instructors.success,
              errors: results.instructors.errors
            },
            courses: {
              success: results.courses.success,
              errors: results.courses.errors
            },
            unknown: results.unknown
          }
        }
      });
    } else {
      return res.status(STATUS_MESSAGES.OK).json({
        success: true,
        message: `Import completed: ${results.success.length} successful, ${results.errors.length} errors`,
        data: {
          total: results.total,
          successful: results.success.length,
          errors: results.errors.length,
          details: {
            success: results.success,
            errors: results.errors
          }
        }
      });
    }
  } catch (error) {
    console.error('Import error:', error);
    return res.status(STATUS_MESSAGES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to import data',
      error: error.message
    });
  }
};

module.exports = {
  importDataController,
  uploadMiddleware
};

