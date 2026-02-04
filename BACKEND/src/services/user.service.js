
const { prisma } = require('../config/db');
const { hashPassword } = require('../utils/hash.js');
const { UserRole } = require('@prisma/client');

const createUser = async (FirstName, LastName, Email, Password, Role, employeeId) => {
    
    if (!Role || !UserRole[Role]) {
        throw new Error(`Invalid or missing role provided: ${Role}`);
    }

    const hashedPassword = await hashPassword(Password);
    const combinedName = `${FirstName} ${LastName}`;

    const user = await prisma.user.create({
        data: {
            email: Email,
            password: hashedPassword, 
            name: combinedName,     
            roles: [UserRole[Role]],
            employeeId: employeeId
        }
    });
    return user;
}

const getAllUsers = async () => {
    const users = await prisma.user.findMany();
    return users;
}

const getUserById = async (userId) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        }
    });
    return user;
}

const updateUser = async (userId, FirstName, LastName, Email, Password, Role, employeeId) => {
    
    const dataToUpdate = {};

    if (Email) {
        dataToUpdate.email = Email;
    }
    
    if (Password) {
        dataToUpdate.password = await hashPassword(Password);
    }
    
    if (Role) {
        if (!UserRole[Role]) {
            throw new Error(`Invalid role type provided: ${Role}`);
        }
        dataToUpdate.roles = [UserRole[Role]];
    }

    if (employeeId) {
        dataToUpdate.employeeId = employeeId;
    }
    
    if (FirstName || LastName) {
        const user = await prisma.user.findUnique({
            where: { id: userId }, 
            select: { name: true }
        });

        if (!user) {
            throw new Error("User not found to update name");
        }

        const [currentFirstName, currentLastName] = user.name.split(' ');
        
        const newFirstName = FirstName || currentFirstName;
        const newLastName = LastName || currentLastName;
        dataToUpdate.name = `${newFirstName} ${newLastName}`;
    }

    const updatedUser = await prisma.user.update({
        where: {id: userId}, 
        data: dataToUpdate 
    });
    return updatedUser;
}

const deleteUser = async (userId) => {
    const deletedUser = await prisma.user.delete({
        where: {
            id: userId 
        }
    });
    return deletedUser;
}

module.exports = {createUser, getAllUsers, getUserById, updateUser, deleteUser};