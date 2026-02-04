const express = require("express");
const { createStudentGroupController, updateStudentGroupController, deleteStudentGroupController, getAllStudentGroupsController, getStudentGroupByIdController } = require("../controllers/studentGroup.controller");
const { createStudentGroupSchema, updateStudentGroupSchema, paramsSchema, validate } = require("../validators/studentGroup.validator");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");
const router = express.Router();

router.get('/', isAuthenticated, getAllStudentGroupsController);
router.get('/:studentGroupId', isAuthenticated, validate(paramsSchema, 'params'), getStudentGroupByIdController);

router.post('/', isAuthenticated, isAdmin, validate(createStudentGroupSchema, 'body'), createStudentGroupController);
router.patch('/:studentGroupId', isAuthenticated, isAdmin, validate(paramsSchema, 'params'), validate(updateStudentGroupSchema, 'body'), updateStudentGroupController);
router.delete('/:studentGroupId', isAuthenticated, isAdmin, validate(paramsSchema, 'params'), deleteStudentGroupController);

module.exports = router;