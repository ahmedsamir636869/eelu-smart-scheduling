const { createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse } = require('../services/course.service');
const STATUS_MESSAGES = require('../constants/status.messages');


const createCourseController = async (req, res) => {
    try{
        const course = await createCourse(req.body);
        return res.status(STATUS_MESSAGES.CREATED).json({
            course,
            message: 'Course created successfully'
        });
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'Failed to create course',
            error: error.message
        });
    }
} 

const getAllCoursesController = async (req, res) => {
    try{
        const collegeId = req.query.collegeId;
        const courses = await getAllCourses(collegeId);
        return res.status(STATUS_MESSAGES.OK).json({
            courses,
            message: 'These are all courses'
        });
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'Failed to get courses',
            error: error.message
        });
    }
}

const getCourseByIdController = async (req, res) => {
    const courseId = req.params.courseId;
    try{
        const course = await getCourseById(courseId);
        return res.status(STATUS_MESSAGES.OK).json({
            course,
            message: 'This Is the course that you want'
        });
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'Failed to get course',
            error: error.message
        });
    }
}

const updateCourseController = async (req, res) => {
    const courseId = req.params.courseId;
    try{
        const updatedCourse = await updateCourse(courseId, req.body);
        return res.status(STATUS_MESSAGES.OK).json({
            updatedCourse,
            message: 'Course updated successfully'
        });
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'Failed to update course',
            error: error.message
        });
    }
}


const deletedCourseController = async (req, res) => {
    const courseId = req.params.courseId;
    try{
        const deletedCourse = await deleteCourse(courseId);
        return res.status(STATUS_MESSAGES.OK).json({
            deletedCourse,
            message: 'Course deleted successfully'
        })
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'Failed to delete course',
            error: error.message
        });
    }
}


module.exports = { createCourseController, getAllCoursesController, getCourseByIdController, updateCourseController, deletedCourseController };