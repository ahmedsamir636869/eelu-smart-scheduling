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
              year: true
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
              name: true
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
 * Get all schedules
 */
const getAllSchedules = async () => {
  const schedules = await prisma.schedule.findMany({
    include: {
      sessions: {
        include: {
          course: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              year: true
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
              name: true
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

