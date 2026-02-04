const { prisma } = require('../config/db');

const createClassroom = async (name, capacity, type, campusName) => {
    const campus = await prisma.campus.findUnique({
        where: {
            name: campusName
        }
    });

    if (!campus) {
        throw new Error(`Campus "${campusName}" not found`);
    }

    const classroom = await prisma.classroom.create({
        data: {
            name,
            capacity,
            type,
            campusId: campus.id
        }
    });
    return classroom;
}

const getAllClassrooms = async (campusName) => {
    if (!campusName) {
        throw new Error("Campus name is required to fetch classrooms");
    }

    const campus = await prisma.campus.findUnique({
        where: {
            name: campusName
        }
    });

    if (!campus) {
        throw new Error(`Campus "${campusName}" not found`);
    }

    const classrooms = await prisma.classroom.findMany({
        where: {
            campusId: campus.id
        },
    });
    return classrooms;
};

const getClassroomById = async (ClassroomId) => {
    const classroom = await prisma.classroom.findUnique({
        where: {
            id: ClassroomId
        }
    });
    return classroom;
};

const updateClassroom = async (ClassroomId, name, capacity, type, campusName) => {
    const dataToUpdate = {};

    if (name) dataToUpdate.name = name;
    if (capacity) dataToUpdate.capacity = capacity;
    if (type) dataToUpdate.type = type;

    if (campusName) {
        const campus = await prisma.campus.findUnique({
            where: {
                name: campusName
            }
        });

        if (!campus) {
            throw new Error(`Campus "${campusName}" not found`);
        }
        dataToUpdate.campusId = campus.id;
    }

    const existingClassroom = await prisma.classroom.findUnique({
        where: { id: ClassroomId }
    });

    if (!existingClassroom) {
        throw new Error(`Classroom with ID ${ClassroomId} not found`);
    }

    const updatedClassroom = await prisma.classroom.update({
        where: {id: ClassroomId},
        data: dataToUpdate 
    });
    return updatedClassroom;
};

const deleteClassroom = async (ClassroomId) => {
    const existingClassroom = await prisma.classroom.findUnique({
        where: { id: ClassroomId }
    });

    if (!existingClassroom) {
        throw new Error(`Classroom with ID ${ClassroomId} not found`);
    }

    const deletedClassroom = await prisma.classroom.delete({
        where: {id: ClassroomId}
    });
    return deletedClassroom;
};

module.exports = { createClassroom, getAllClassrooms, getClassroomById, updateClassroom, deleteClassroom };