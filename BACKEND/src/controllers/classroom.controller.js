const {createClassroom, getAllClassrooms, getClassroomById, updateClassroom, deleteClassroom} = require('../services/classroom.service');
const STATUS_MESSAGES = require('../constants/status.messages');


const createClassroomController = async (req, res) => {
    const {name, capacity, type, campusName} = req.body;
    try{
        const classroom = await createClassroom(name, capacity, type, campusName);
        return res.status(STATUS_MESSAGES.CREATED).json({
            message: "Classroom created successfully",
            classroom
        });
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: "Failed to create classroom",
            error: error.message
        });
    }
}

const getAllClassroomsController = async (req, res) => {
    const {campusName} = req.query;
    try{
        const classrooms = await getAllClassrooms(campusName);
        return res.status(STATUS_MESSAGES.OK).json({
            message: "Classrooms fetched successfully",
            classrooms
        });
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: "Failed to fetch classrooms",
            error: error.message
        });
    }
}

const getClassroomByIdController = async (req, res) => {
    const {classroomId} = req.params;
    try{
        const classroom = await getClassroomById(classroomId);
        return res.status(STATUS_MESSAGES.OK).json({
            message: "Classroom fetched successfully",
            classroom
        });
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: "Failed to fetch classroom",
            error: error.message
        });
    }
}

const updateClassroomController = async (req, res) => {
    const {classroomId} = req.params;
    const {name, capacity, type, campusName} = req.body;
    try{
        const updatedClassroom = await updateClassroom(classroomId, name, capacity, type, campusName);
        return res.status(STATUS_MESSAGES.OK).json({
            message: "Classroom updated successfully",
            updatedClassroom
        });
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: "Failed to update classroom",
            error: error.message
        });
    }
}

const deleteClassroomController = async (req, res) => {
    const {classroomId} = req.params;
    try{
        const deletedClassroom = await deleteClassroom(classroomId);
        return res.status(STATUS_MESSAGES.OK).json({
            message: "Classroom deleted successfully",
            deletedClassroom
        });
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: "Failed to delete classroom",
            error: error.message
        });
    }
}

module.exports = { createClassroomController, getAllClassroomsController, getClassroomByIdController, updateClassroomController, deleteClassroomController };