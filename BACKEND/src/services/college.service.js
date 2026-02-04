const { prisma } = require('../config/db');

const createCollege = async (name, campusId) => {
    const college = await prisma.college.create({
        data: {
            name,
            campusId,
        },
    })
    return college;
}

const getAllColleges = async (campusId) => {
    const colleges = await prisma.college.findMany({
        where: {
            campusId,
        },
    })
    return colleges;
}

const getCollegeById = async (collegeId) => {
    const college = await prisma.college.findUnique({
        where: {
            id: collegeId,
        },
    })
    return college;
}

const updateCollege = async (collegeId, name, campusId) => {
    const updatedCollege = await prisma.college.update({
        where: { id: collegeId },
        data: { name, campusId },
    })
    return updatedCollege;
}

const deleteCollege = async (collegeId) => {
    const deletedCollege = await prisma.college.delete({
        where: { id: collegeId },
    })
    return deletedCollege;
}

module.exports = { createCollege, getAllColleges, getCollegeById, updateCollege, deleteCollege };