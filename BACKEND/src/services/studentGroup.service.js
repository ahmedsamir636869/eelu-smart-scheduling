const { prisma } = require('../config/db');


const createStudentGroup = async (name, year, studentCount, departmentId) => {
    try {
        // Validate input
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            throw new Error('Student group name is required');
        }
        if (typeof year !== 'number' || year < 1 || year > 4) {
            throw new Error('Year must be a number between 1 and 4');
        }
        if (typeof studentCount !== 'number' || studentCount < 0) {
            throw new Error('Student count must be a non-negative number');
        }
        if (!departmentId || typeof departmentId !== 'string') {
            throw new Error('Department ID is required');
        }
        
        // Verify department exists
        const department = await prisma.department.findUnique({
            where: { id: departmentId }
        });
        
        if (!department) {
            throw new Error(`Department with ID ${departmentId} not found`);
        }
        
        const studentGroup = await prisma.studentGroup.create({
            data: {
                name: name.trim(),
                year,
                studentCount,
                departmentId
            },
            include: {
                department: {
                    include: {
                        college: true
                    }
                }
            }
        });
        
        return studentGroup;
    } catch (error) {
        console.error('Error creating student group:', error);
        throw error;
    }
}

const getAllStudentGroups = async() => {
    try {
        const studentGroups = await prisma.studentGroup.findMany({
            include: {
                department: {
                    include: {
                        college: true
                    }
                }
            },
            orderBy: [
                { year: 'asc' },
                { name: 'asc' }
            ]
        });
        
        // Validate that all student groups have required relations
        const validGroups = studentGroups.filter(group => {
            if (!group.department) {
                console.warn(`Student group ${group.id} is missing department relation`);
                return false;
            }
            return true;
        });
        
        return validGroups;
    } catch (error) {
        console.error('Error fetching student groups:', error);
        throw error;
    }
}

const getStudentGroupById = async(studentGroupId) => {
    try {
        if (!studentGroupId) {
            throw new Error('Student group ID is required');
        }
        
        const studentGroup = await prisma.studentGroup.findUnique({
            where: {
                id: studentGroupId
            },
            include: {
                department: {
                    include: {
                        college: true
                    }
                }
            }
        });
        
        if (!studentGroup) {
            throw new Error(`Student group with ID ${studentGroupId} not found`);
        }
        
        if (!studentGroup.department) {
            throw new Error(`Student group ${studentGroupId} is missing department relation`);
        }
        
        return studentGroup;
    } catch (error) {
        console.error(`Error fetching student group ${studentGroupId}:`, error);
        throw error;
    }
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