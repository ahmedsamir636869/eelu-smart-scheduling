const { prisma } = require('../config/db.js');

const createInstructor = async (name, email, departmentId, employmentType) => {
    const instructor = await prisma.instructor.create({
        data: { name, email, departmentId, employmentType }
    });
    return instructor;
};

const getAllInstructors = async () => {
    const instructors = await prisma.instructor.findMany({
        include: {
            assignedCourses: {
                select: { id: true, name: true, code: true }
            },
            availability: true
        }
    });
    return instructors;
};

const getInstructorById = async (instructorId) => {
    const instructor = await prisma.instructor.findUnique({
        where: { id: instructorId },
        include: {
            assignedCourses: {
                select: { id: true, name: true, code: true }
            },
            availability: true
        }
    });
    return instructor;
};

const getInstructorByUserId = async (userId) => {
    const instructor = await prisma.instructor.findUnique({
        where: { userId }
    });
    return instructor;
};

const updateInstructor = async (instructorId, name, email, employmentType) => {
    const dataToUpdate = {};
    if (name)           dataToUpdate.name           = name;
    if (email)          dataToUpdate.email          = email;
    if (employmentType) dataToUpdate.employmentType = employmentType;

    const updatedInstructor = await prisma.instructor.update({
        where: { id: instructorId },
        data: dataToUpdate
    });
    return updatedInstructor;
};

const deleteInstructor = async (instructorId) => {
    const deletedInstructor = await prisma.instructor.delete({
        where: { id: instructorId }
    });
    return deletedInstructor;
};

// --- Availability (Part-time only) ---

const submitAvailability = async (instructorId, slots) => {
    const instructor = await prisma.instructor.findUnique({
        where: { id: instructorId }
    });
    if (!instructor) throw new Error('Instructor not found');
    if (instructor.employmentType === 'FULL_TIME') {
        throw new Error('Full-time instructors are not required to submit availability');
    }

    const results = await Promise.all(
        slots.map(({ day, startTime, endTime }) =>
            prisma.instructorAvailability.upsert({
                where: { instructorId_day: { instructorId, day } },
                update: {
                    startTime: new Date(startTime),
                    endTime:   new Date(endTime),
                    status:    'PENDING'
                },
                create: {
                    instructorId,
                    day,
                    startTime: new Date(startTime),
                    endTime:   new Date(endTime),
                    status:    'PENDING'
                }
            })
        )
    );
    return results;
};

const getMyAvailability = async (instructorId) => {
    const slots = await prisma.instructorAvailability.findMany({
        where: { instructorId },
        orderBy: { day: 'asc' }
    });
    return slots;
};

const reviewAvailability = async (availabilityId, status) => {
    const updated = await prisma.instructorAvailability.update({
        where: { id: availabilityId },
        data:  { status }
    });
    return updated;
};

module.exports = {
    createInstructor,
    getAllInstructors,
    getInstructorById,
    getInstructorByUserId,
    updateInstructor,
    deleteInstructor,
    submitAvailability,
    getMyAvailability,
    reviewAvailability
};
