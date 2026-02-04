const express = require("express");
const { createCampusController, getAllCampusesController, getCampusByIdController, updateCampusController, deleteCampusController } = require("../controllers/campus.controller");
const { validate, createCampusSchema, updateCampusSchema, paramsSchema } = require("../validators/campus.validator");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", isAuthenticated, getAllCampusesController);
router.get("/:campusId", isAuthenticated, validate(paramsSchema, 'params'), getCampusByIdController);

router.post("/", isAuthenticated, isAdmin, validate(createCampusSchema, 'body'), createCampusController);
router.patch("/:campusId", isAuthenticated, isAdmin, validate(paramsSchema, 'params'), validate(updateCampusSchema, 'body'), updateCampusController);
router.delete("/:campusId", isAuthenticated, isAdmin, validate(paramsSchema, 'params'), deleteCampusController);

module.exports = router;