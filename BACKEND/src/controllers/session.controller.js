const { createSession, getAllSessions, getSessionById, updateSession, deleteSession } = require('../services/session.service');
const STATUS_MESSAGES = require('../constants/status.messages');


const createSessionController = async (req, res) => {
    const {name, courseId, type} = req.body;
    try{
        const session = await createSession(name, courseId, type);
        return res.status(STATUS_MESSAGES.CREATED).json({
            session,
            message: 'Session created successfully'
        });
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'Failed to create session',
            error: error.message
        });
    }
}

const getAllSessionsController = async (req, res) => {
    try{
        const sessions = await getAllSessions();
        return res.status(STATUS_MESSAGES.OK).json({
            sessions,
            message: 'These are all sessions'
        });
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'Failed to get sessions',
            error: error.message
        });
    }
}

const getSessionByIdController = async (req, res) => {
    const sessionId = req.params.sessionId;
    try{
        const session = await getSessionById(sessionId);
        return res.status(STATUS_MESSAGES.OK).json({
            session,
            message: 'This is the session that you want'
        });
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'Failed to get this session',
            error: error.message
        });
    }
}

const updateSessionController = async (req, res) => {
    const sessionId =req.params.sessionId;
    const {name, courseId, type} = req.body;
    try{
        const updatedSession = await updateSession(sessionId, name, courseId, type);
        return res.status(STATUS_MESSAGES.OK).json({
            updatedSession,
            message: 'Session updated successfully'
        });
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'Failed to update this session',
            error: error.message
        });
    }
}

const deleteSessionController = async (req, res) => {
    const sessionId = req.params.sessionId;
    try{
        const deletedSession = await deleteSession(sessionId);
        return res.status(STATUS_MESSAGES.OK).json({
            deletedSession,
            message: 'Session deleted successfully'
        });
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'Failed to delete this session',
            error: error.message
        });
    }
}


module.exports = { createSessionController, getAllSessionsController, getSessionByIdController, updateSessionController, deleteSessionController };
