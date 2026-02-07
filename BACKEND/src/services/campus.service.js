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
    if (!campusId || campusId === 'undefined') {
        throw new Error('Campus ID is required');
    }
    
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
    
    if (!campus) {
        throw new Error(`Campus with ID ${campusId} not found`);
    }
    
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
    // Validate campus exists
    const campus = await prisma.campus.findUnique({
        where: { id: campusId },
        include: {
            classrooms: {
                select: {
                    id: true,
                    name: true
                }
            },
            colleges: {
                select: {
                    id: true,
                    name: true,
                    _count: {
                        select: {
                            departments: true
                        }
                    }
                }
            }
        }
    });

    if (!campus) {
        throw new Error(`Campus with ID ${campusId} not found`);
    }

    // Check if campus has classrooms (these require a campusId, so we can't delete)
    if (campus.classrooms && campus.classrooms.length > 0) {
        const classroomNames = campus.classrooms.map(c => c.name).join(', ');
        throw new Error(`Cannot delete campus "${campus.name}": It has ${campus.classrooms.length} classroom(s) associated with it (${classroomNames}). Please delete all classrooms first.`);
    }

    // Note: Colleges can exist without a campus (ON DELETE SET NULL), so we allow deletion
    // even if colleges exist. They will automatically have their campusId set to null.

    // Delete the campus
    const deletedCampus = await prisma.campus.delete({
        where: { id: campusId }
    });
    
    return deletedCampus;
}

module.exports = { createCampus, getAllCampuses, getCampusById, updateCampus, deleteCampus };