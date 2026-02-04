const { PrismaClient } = require('@prisma/client');


const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Connected to the database successfully');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

module.exports = {
  prisma,
  connectDB,
  disconnectDB,
};
