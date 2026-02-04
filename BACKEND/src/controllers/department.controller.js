const {createDepartment, getAllDepartments, getDepartmentById, updateDepartment, deleteDepartment} = require('../services/department.service');
const STATUS_MESSAGES = require('../constants/status.messages');


const createDepartmentController= async (req, res) => {
    const {name, code, collegeId} = req.body;
    try{
        const department = await createDepartment(name, code, collegeId);
        return res.status(STATUS_MESSAGES.CREATED).json({
            department,
            message : 'department created successfully'
        })
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'failed to create this department',
            error: error.message
        })
    }
}

const getAllDepartmentsController = async (req, res) => {
    const collegeId = req.params.collegeId;
    try{
        const departments = await getAllDepartments(collegeId);
        return res.status(STATUS_MESSAGES.OK).json({
            departments,
            message: 'this is all departments'
        });
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'failed to find departments',
            error: error.message
        })
    }
}

const getDepartmentByIdController = async (req, res) => {
    const departmentId = req.params.departmentId;
    try{
        const department = await getDepartmentById(departmentId);
        return res.status(STATUS_MESSAGES.OK).json({
            department,
            message: 'this is the department that you want'
        });
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'failed to find this department',
            error: error.message
        })
    }
}

const updateDepartmentController = async (req, res) => {
    const departmentId = req.params.departmentId;
    const {name, code, collegeId} = req.body;
    try{
        const updatedDepartment = await updateDepartment(departmentId, name, code, collegeId);
        return res.status(STATUS_MESSAGES.OK).json({
            updatedDepartment,
            message : 'department updated successfully'
        });
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'failed to update this department',
            error: error.message 
        })
    }
}

const deleteDepartmentController = async (req, res) => {
    const departmentId = req.params.departmentId;
    try{
        const deletedDepartment = await deleteDepartment(departmentId);
        return res.status(STATUS_MESSAGES.OK).json({
            deletedDepartment,
            message: 'department deleted successfully'
        })
    }catch(error){
        return res.status(STATUS_MESSAGES.BAD_REQUEST).json({
            message: 'failed to delete this department',
            error: error.message
        })
    }
}

module.exports = {createDepartmentController, getAllDepartmentsController, getDepartmentByIdController, updateDepartmentController, deleteDepartmentController};