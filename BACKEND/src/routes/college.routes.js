const express = require("express");
const { createCollegeController, getAllCollegesController, getCollegeByIdController, updateCollegeController, deleteCollegeController } = require("../controllers/college.controller");
const {validate, paramsForGetAllSchema, paramsForSingleCollegeSchema, createCollegeSchema, updateCollegeSchema} = require("../validators/college.validator");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/:campusId", isAuthenticated, validate(paramsForGetAllSchema, 'params'), getAllCollegesController);
router.get("/:collegeId", isAuthenticated, validate(paramsForSingleCollegeSchema, 'params'), getCollegeByIdController);

router.post("/", isAuthenticated, isAdmin, validate(createCollegeSchema, 'body'), createCollegeController);
router.patch("/:collegeId", isAuthenticated, isAdmin, validate(paramsForSingleCollegeSchema, 'params'), validate(updateCollegeSchema, 'body'), updateCollegeController);
router.delete("/:collegeId", isAuthenticated, isAdmin, validate(paramsForSingleCollegeSchema, 'params'), deleteCollegeController);

module.exports = router;