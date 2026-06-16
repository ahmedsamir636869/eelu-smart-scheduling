const { prisma } = require('../config/db.js');

// --- TA CRUD ---

const createTA = async (name, email, departmentId, isExpatriate = false) => {
    const ta = await prisma.tA.create({
        data: { name, email, departmentId, isExpatriate }
    });
    return ta;
};

const getAllTAs = async () => {
    const tas = await prisma.tA.findMany({
        include: {
            department: { select: { id: true, name: true } },
            courses:    { select: { id: true, name: true, code: true } }
        }
    });
    return tas;
};

const getTAById = async (taId) => {
    const ta = await prisma.tA.findUnique({
        where: { id: taId },
        include: {
            department: { select: { id: true, name: true } },
            courses:    { select: { id: true, name: true, code: true } }
        }
    });
    return ta;
};

const getTAByUserId = async (userId) => {
    const ta = await prisma.tA.findUnique({
        where: { userId }
    });
    return ta;
};

const updateTA = async (taId, name, email, isExpatriate) => {
    const dataToUpdate = {};
    if (name)                    dataToUpdate.name         = name;
    if (email)                   dataToUpdate.email        = email;
    if (isExpatriate !== undefined) dataToUpdate.isExpatriate = isExpatriate;

    const updatedTA = await prisma.tA.update({
        where: { id: taId },
        data:  dataToUpdate
    });
    return updatedTA;
};

const deleteTA = async (taId) => {
    const deletedTA = await prisma.tA.delete({
        where: { id: taId }
    });
    return deletedTA;
};

// --- Reports ---

const submitReport = async (taId, title, content) => {
    const report = await prisma.tAReport.create({
        data: { taId, title, content }
    });
    return report;
};

const getMyReports = async (taId) => {
    const reports = await prisma.tAReport.findMany({
        where:   { taId },
        orderBy: { createdAt: 'desc' }
    });
    return reports;
};

const getAllReports = async () => {
    const reports = await prisma.tAReport.findMany({
        include: {
            ta: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
    return reports;
};

const markReportRead = async (reportId) => {
    const updated = await prisma.tAReport.update({
        where: { id: reportId },
        data:  { status: 'READ' }
    });
    return updated;
};

// --- Off Days ---

const setOffDays = async (taId, days) => {
    const ta = await prisma.tA.findUnique({ where: { id: taId } });
    if (!ta) throw new Error('TA not found');

    // Replace all existing off days with the new set
    await prisma.tAOffDay.deleteMany({ where: { taId } });

    if (days.length === 0) return [];

    const created = await prisma.tAOffDay.createMany({
        data: days.map(day => ({ taId, day }))
    });
    return prisma.tAOffDay.findMany({ where: { taId } });
};

const getOffDays = async (taId) => {
    return prisma.tAOffDay.findMany({
        where:   { taId },
        orderBy: { day: 'asc' }
    });
};

module.exports = {
    createTA,
    getAllTAs,
    getTAById,
    getTAByUserId,
    updateTA,
    deleteTA,
    submitReport,
    getMyReports,
    getAllReports,
    markReportRead,
    setOffDays,
    getOffDays
};
