
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

// Update user's own profile (limited fields)
const updateProfile = async (userId, data) => {
    const dataToUpdate = {};
    
    if (data.name) {
        dataToUpdate.name = data.name;
    }
    
    if (data.email) {
        // Check if email is already taken by another user
        const existingUser = await prisma.user.findFirst({
            where: {
                email: data.email,
                NOT: { id: userId }
            }
        });
        
        if (existingUser) {
            throw new Error('Email is already in use by another user');
        }
        
        dataToUpdate.email = data.email;
        // Reset email verification if email changed
        dataToUpdate.emailVerified = false;
    }
    
    if (data.password) {
        if (data.password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }
        dataToUpdate.password = await hashPassword(data.password);
    }
    
    if (data.isExpatriate !== undefined) {
        dataToUpdate.isExpatriate = data.isExpatriate;
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: {
            id: true,
            name: true,
            email: true,
            roles: true,
            isExpatriate: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true
        }
    });
    
    return updatedUser;
}

module.exports = {createUser, getAllUsers, getUserById, updateUser, deleteUser, updateProfile};