const { prisma } = require('../config/db');

/**
 * Get schedule by ID with sessions
 */
const getScheduleById = async (scheduleId) => {
  const schedule = await prisma.schedule.findUnique({
    where: {
      id: scheduleId
    },
    include: {
      sessions: {
        include: {
          course: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              year: true,
              college: { select: { id: true, name: true } }
            }
          },
          instructor: {
            select: {
              id: true,
              name: true
            }
          },
          classroom: {
            select: {
              id: true,
              name: true,
              capacity: true
            }
          }
        },
        orderBy: [
          { day: 'asc' },
          { startTime: 'asc' }
        ]
      }
    }
  });

  if (!schedule) {
    throw new Error('Schedule not found');
  }

  return schedule;
};

/**
 * Get all schedules, optionally scoped by campus and/or semester.
 * @param {{ campusId?: string, semester?: string }} [filters]
 */
const getAllSchedules = async ({ campusId, semester } = {}) => {
  const where = {};
  if (campusId) where.campusId = campusId;
  if (semester) where.semester = semester;

  const schedules = await prisma.schedule.findMany({
    where,
    include: {
      sessions: {
        include: {
          course: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              year: true,
              college: { select: { id: true, name: true } }
            }
          },
          instructor: {
            select: {
              id: true,
              name: true
            }
          },
          classroom: {
            select: {
              id: true,
              name: true,
              capacity: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return schedules;
};

module.exports = {
  getScheduleById,
  getAllSchedules
};

