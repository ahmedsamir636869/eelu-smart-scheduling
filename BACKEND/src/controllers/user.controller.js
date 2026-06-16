const {createUser, getAllUsers, getUserById, updateUser, deleteUser, updateProfile} = require('../services/user.service');
const STATUS_MESSAGES = require('../constants/status.messages');


const createUserController = async (req, res) => {
    const {FirstName, LastName, Email, Password, Role, employeeId} = req.body;
    try{
        const user = await createUser(FirstName, LastName, Email, Password, Role, employeeId);
        return res.status(STATUS_MESSAGES.CREATED).json({
            user,
            message: 'a new user created successfully'
        })
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'failed to create new user',
            error: error.message
        })
    }
}

const getAllUsersController = async (req, res) => {
    try{
        const users = await getAllUsers();
        return res.status(STATUS_MESSAGES.OK).json({
            users,
            message: 'those are all users'
        })
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'failed to get the users',
            error: error.message
        })
    }
}

const getUserByIdController = async (req, res) => {
    const userId = req.params.userId;
    try{
        const user = await getUserById(userId);
        return res.status(STATUS_MESSAGES.OK).json({
            user,
            message: 'this is the user that you want'
        })
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'failed to get that user',
            error: error.message
        })
    }
}

const updateUserController = async (req, res) => {
    const userId = req.params.userId;
    const {FirstName, LastName, Email, Password, Role, employeeId} = req.body;
    try{
        const UpdatedUser = await updateUser(userId, FirstName, LastName, Email, Password, Role, employeeId);
        return res.status(STATUS_MESSAGES.OK).json({
            UpdatedUser,
            message: 'user updated successfully'
        })
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'failed to update this user',
            error: error.message
        })
    }
}

const deleteUserController = async (req, res) => {
    const userId = req.params.userId;
    try{
        const deletedUser = await deleteUser(userId);
        return res.status(STATUS_MESSAGES.OK).json({
            deletedUser,
            message: 'user deleted successfully'
        })
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'failed to delete this user',
            error: error.message
        })
    }
}

const updateProfileController = async (req, res) => {
    const userId = req.user.id; // Get from authenticated user
    try{
        const updatedUser = await updateProfile(userId, req.body);
        return res.status(STATUS_MESSAGES.OK).json({
            user: updatedUser,
            message: 'Profile updated successfully'
        })
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'Failed to update profile',
            error: error.message
        })
    }
}

module.exports = {createUserController, getAllUsersController, getUserByIdController, updateUserController, deleteUserController, updateProfileController};