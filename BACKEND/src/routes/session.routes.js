const express = require("express");
const { createSessionController, getAllSessionsController, getSessionByIdController, updateSessionController, deleteSessionController } = require("../controllers/session.controller");
const { createSessionSchema, updateSessionSchema, paramsSchema, validate } = require("../validators/session.validator");
const { isAuthenticated, isAdmin, isInstructorOrAdmin } = require("../middleware/auth.middleware");
const router = express.Router();

router.get("/", isAuthenticated, getAllSessionsController);
router.get("/:sessionId", isAuthenticated, validate(paramsSchema, 'params'), getSessionByIdController);

router.patch("/:sessionId", isAuthenticated, isInstructorOrAdmin, validate(updateSessionSchema, 'body'), validate(paramsSchema, 'params'), updateSessionController);

router.post("/", isAuthenticated, isAdmin, validate(createSessionSchema, 'body'), createSessionController);
router.delete("/:sessionId", isAuthenticated, isAdmin, validate(paramsSchema, 'params'), deleteSessionController);

module.exports = router;
