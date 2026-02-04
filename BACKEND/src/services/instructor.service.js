const { prisma } = require('../config/db.js');

const createInstructor = async (name, type, departmentId, day, startTime, endTime, weeklyHours) => {
    const instructor = await prisma.instructor.create({
        data: {
            name,
            type,
            departmentId,
            day,
            startTime,
            endTime,
            weeklyHours
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

const updateInstructor = async (instructorId, name, type, day, startTime, endTime, weeklyHours) => {
    const updatedInstructor = await prisma.instructor.update({
        where: {
            id: instructorId
        },
        data: {
            name,
            type,
            day,
            startTime,
            endTime,
            weeklyHours
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
