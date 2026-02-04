const express = require("express");
const { createClassroomController, getAllClassroomsController, getClassroomByIdController, updateClassroomController, deleteClassroomController } = require("../controllers/classroom.controller");
const { validate, createClassroomSchema, getAllClassroomsSchema, updateClassroomSchema, classroomIdParamSchema } = require("../validators/classroom.validator");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", isAuthenticated, validate(getAllClassroomsSchema, "body"), getAllClassroomsController);
router.get("/:classroomId", isAuthenticated, validate(classroomIdParamSchema, "params"), getClassroomByIdController);

router.post("/", isAuthenticated, isAdmin, validate(createClassroomSchema, "body"), createClassroomController);
router.patch("/:classroomId", isAuthenticated, isAdmin, validate(updateClassroomSchema, "body"), updateClassroomController);
router.delete("/:classroomId", isAuthenticated, isAdmin, validate(classroomIdParamSchema, "params"), deleteClassroomController);

module.exports = router;