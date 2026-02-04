const { prisma } = require('../config/db.js');

const createDepartment = async (name, code, collegeId) => {
    const department = await prisma.department.create({
        data: {
            name,
            code,
            collegeId,
        }
    }); 
    return department;
}

const getAllDepartments = async (collegeId) => {
    const Departments = await prisma.department.findMany({
        where: {
            collegeId
        }
    });
    return Departments;
}

const getDepartmentById = async (departmentId) => {
    const department = await prisma.department.findUnique({
        where: {
            id: departmentId
        }
    });
    return department;
}

const updateDepartment = async (departmentId, name, code, collegeId) => {
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (collegeId !== undefined) updateData.collegeId = collegeId;
    
    const UpdatedDepartment = await prisma.department.update({
        where: { id: departmentId },
        data: updateData
    });
    return UpdatedDepartment;
}

const deleteDepartment = async (departmentId) => {
    const deletedDepartment = await prisma.department.delete({
        where: {
            id: departmentId
        }
    });
    return deletedDepartment;
}


module.exports = {createDepartment, getAllDepartments, getDepartmentById, updateDepartment, deleteDepartment};