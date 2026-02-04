const express = require("express");
const { createCourseController, getAllCoursesController, getCourseByIdController, updateCourseController, deletedCourseController } = require("../controllers/course.controller");
const { createCourseSchema, updateCourseSchema, paramsSchema, validate } = require("../validators/course.validator");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", isAuthenticated, getAllCoursesController);
router.get("/:courseId", isAuthenticated, validate(paramsSchema, 'params'), getCourseByIdController);

router.post("/", isAuthenticated, isAdmin, validate(createCourseSchema, 'body'), createCourseController);
router.patch("/:courseId", isAuthenticated, isAdmin, validate(paramsSchema, 'params'), validate(updateCourseSchema, 'body'), updateCourseController);
router.delete("/:courseId", isAuthenticated, isAdmin, validate(paramsSchema, 'params'), deletedCourseController);

module.exports = router;