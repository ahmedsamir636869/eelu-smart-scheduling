const express = require("express");
const {createUserController, getAllUsersController, getUserByIdController, updateUserController, deleteUserController} = require('../controllers/user.controller');
const {createUserSchema, updateUserSchema, userIdSchema, validate} = require('../validators/user.validator');
const { isAuthenticated, isAdmin, isOwnerOrAdmin } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", isAuthenticated, isAdmin, getAllUsersController);
router.get("/:userId", isAuthenticated, isOwnerOrAdmin('userId'), validate(userIdSchema, 'params'), getUserByIdController);

router.post("/", isAuthenticated, isAdmin, validate(createUserSchema, 'body'), createUserController);
router.patch("/:userId", isAuthenticated, isAdmin, validate(updateUserSchema, 'body'), validate(userIdSchema, 'params'), updateUserController);
router.delete("/:userId", isAuthenticated, isAdmin, validate(userIdSchema, 'params'), deleteUserController);

module.exports = router;