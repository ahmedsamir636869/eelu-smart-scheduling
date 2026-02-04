const express = require("express");
const {createDepartmentController, getAllDepartmentsController, getDepartmentByIdController, updateDepartmentController, deleteDepartmentController} = require('../controllers/department.controller')
const {validate, paramsForGetAllSchema, paramsForSingleDepartmentSchema, createDepartmentSchema, updateDepartmentSchema} = require('../validators/department.validator');
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");
const router = express.Router();

router.get("/collegeId/:collegeId", isAuthenticated, validate(paramsForGetAllSchema, 'params'), getAllDepartmentsController);
router.get("/:departmentId", isAuthenticated, validate(paramsForSingleDepartmentSchema, 'params'), getDepartmentByIdController);

router.post("/", isAuthenticated, isAdmin, validate(createDepartmentSchema, 'body'), createDepartmentController);
router.patch("/:departmentId", isAuthenticated, isAdmin, validate(paramsForSingleDepartmentSchema, 'params'), validate(updateDepartmentSchema, 'body'), updateDepartmentController);
router.delete("/:departmentId", isAuthenticated, isAdmin, validate(paramsForSingleDepartmentSchema, 'params'), deleteDepartmentController);

module.exports = router;