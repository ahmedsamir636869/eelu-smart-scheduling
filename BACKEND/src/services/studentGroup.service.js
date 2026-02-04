const { prisma } = require('../config/db');


const createStudentGroup = async (name, year, studentCount, departmentId) => {
    const studentGroup = await prisma.studentGroup.create({
        data: {
            name,
            year,
            studentCount,
            departmentId
        }
    })
    return studentGroup;
}

const getAllStudentGroups = async() => {
    const studentGroups = await prisma.studentGroup.findMany();
    return studentGroups;
}

const getStudentGroupById = async(studentGroupId) => {
    const studentGroup = await prisma.studentGroup.findUnique({
        where: {
            id: studentGroupId
        }
    })
    return studentGroup;
}

const updateStudentGroup = async(studentGroupId, name, year, studentCount) => {
    const updatedStudentGroup = await prisma.studentGroup.update({
        where: {
            id: studentGroupId
        },
        data: {
            name,
            year,
            studentCount,
        }
    })
    return updatedStudentGroup;
}

const deleteStudentGroup = async(studentGroupId) => {
    const deletedStudentGroup = await prisma.studentGroup.delete({
        where: {
            id: studentGroupId
        }
    })
    return deletedStudentGroup;
}

module.exports = { createStudentGroup, getAllStudentGroups, getStudentGroupById, updateStudentGroup, deleteStudentGroup };