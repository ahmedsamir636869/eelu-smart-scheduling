const dotenv = require('dotenv');

dotenv.config();

const env = {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    AI_API_URL: process.env.AI_API_URL || 'http://localhost:8000',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',
}

module.exports = env;