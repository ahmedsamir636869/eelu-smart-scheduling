const { prisma } = require('../config/db');


const createCampus = async (name, city, colleges) => {
    const campus = await prisma.campus.create({
        data: {
            name,
            city,
            ...(colleges && {
                colleges: {
                    create: colleges.map((collegeName) => ({ name: collegeName })),
                },
            }),
        },
        include: {
            colleges: {
                select: {
                    id: true,
                    name: true,
                }
            }
        }
    })
    return campus;
}

const getAllCampuses = async () => {
    const campuses = await prisma.campus.findMany({
        include: {
            colleges: {
                select: {
                    id: true,
                    name: true,
                }
            }
        }
    });
    return campuses;
}

const getCampusById = async (campusId) => {
    const campus = await prisma.campus.findUnique({
        where: { id: campusId },
        include: {
            colleges: {
                select: {
                    id: true,
                    name: true,
                }
            }
        }
    })
    return campus;
}

const updateCampus = async (campusId, name, city) => {
    const updatedCampus = await prisma.campus.update({
        where: { id: campusId },
        data: { name, city }
    })
    return updatedCampus;
}

const deleteCampus = async (campusId) => {
    const deletedCampus = await prisma.campus.delete({
        where: { id: campusId }
    })
    return deletedCampus;
}

module.exports = { createCampus, getAllCampuses, getCampusById, updateCampus, deleteCampus };