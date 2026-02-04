const { prisma } = require('../config/db');


const createSession = async (name, courseId, type) => {
    const session = await prisma.session.create({
        data: {
            name,
            courseId,
            type
        }
    })
    return session;
}

const getAllSessions = async() => {
    const sessions = await prisma.session.findMany();
    return sessions;
}

const getSessionById = async(sessionId) => {
    const session = await prisma.session.findUnique({
        where: {
            id: sessionId
        }
    })
    return session;
}

const updateSession = async(sessionId, name, courseId, type) => {
    const updatedSession = await prisma.session.update({
        where: {
            id: sessionId
        },
        data: {
            name,
            courseId,
            type
        }
    })
    return updatedSession;
}

const deleteSession = async(sessionId) => {
    const deletedSession = await prisma.session.delete({
        where: {
            id: sessionId
        }
    })
    return deletedSession;
}


module.exports = { createSession, getAllSessions, getSessionById, updateSession, deleteSession };
