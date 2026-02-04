const { prisma } = require('../config/db.js');

const createInstructor = async (name, departmentId, day, startTime, endTime) => {
    const instructor = await prisma.instructor.create({
        data: {
            name,
            departmentId,
            day,
            startTime,
            endTime
        }
    })
    return instructor;
}

const getAllInstructors = async () => {
    const instructors = await prisma.instructor.findMany();
    return instructors;
}

const getInstructorById = async (instructorId) => {
    const instructor = await prisma.instructor.findUnique({
        where: {
            id: instructorId
        }
    })
    return instructor;
}

const updateInstructor = async (instructorId, name, day, startTime, endTime) => {
    const updatedInstructor = await prisma.instructor.update({
        where: {
            id: instructorId
        },
        data: {
            name,
            day,
            startTime,
            endTime
        }
    })
    return updatedInstructor;
}

const deleteInstructor = async (instructorId) => {
    const deletedInstructor = await prisma.instructor.delete({
        where: {
            id: instructorId
        }
    })
    return deletedInstructor;
}

module.exports = { createInstructor, getAllInstructors, getInstructorById, updateInstructor, deleteInstructor }
