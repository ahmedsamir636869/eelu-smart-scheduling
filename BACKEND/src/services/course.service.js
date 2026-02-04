const { prisma } = require('../config/db');


const createCourse = async (courseData) =>{
    const course = await prisma.course.create({
        data: {
            name: courseData.name,
            code: courseData.code,
            type: courseData.type,
            days: courseData.days,
            hoursPerDay: courseData.hoursPerDay,
            year: courseData.year,
            departmentId: courseData.departmentId,
            collegeId: courseData.collegeId,
            instructorId: courseData.instructorId || null
        }
    });
    return course;
}

const getAllCourses = async (collegeId) => {
    const courses = await prisma.course.findMany({
        where: collegeId ? { collegeId } : undefined,
        include: {
            department: true,
            college: true,
            instructor: true
        }
    });
    return courses;
}

const getCourseById = async (courseId) => {
    const course = await prisma.course.findUnique({
        where: {
            id: courseId
        },
        include: {
            department: true,
            college: true,
            instructor: true
        }
    });
    return course;
}

const updateCourse = async (courseId, courseData) => {
    const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data: {
            name: courseData.name,
            code: courseData.code,
            type: courseData.type,
            days: courseData.days,
            hoursPerDay: courseData.hoursPerDay,
            year: courseData.year,
            departmentId: courseData.departmentId,
            collegeId: courseData.collegeId,
            instructorId: courseData.instructorId
        }
    });
    return updatedCourse;
}

const deleteCourse = async (courseId) => {
    const deletedCourse = await prisma.course.delete({
        where: { id: courseId }
    });
    return deletedCourse;
}

module.exports = { createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse };