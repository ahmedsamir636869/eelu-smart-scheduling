const { prisma } = require('../config/db');

const getAllConstraints = async () => {
    return prisma.constraint.findMany({
        orderBy: { createdAt: 'desc' }
    });
};

const createConstraint = async (data) => {
    return prisma.constraint.create({
        data
    });
};

const updateConstraint = async (id, data) => {
    return prisma.constraint.update({
        where: { id },
        data
    });
};

const deleteConstraint = async (id) => {
    return prisma.constraint.delete({
        where: { id }
    });
};

module.exports = {
    getAllConstraints,
    createConstraint,
    updateConstraint,
    deleteConstraint
};
