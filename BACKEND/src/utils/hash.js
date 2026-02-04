const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/**
 * @param {string} password 
 * @returns {Promise<string>} 
 */
const hashPassword = async (password) => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * @param {string} password 
 * @param {string} hashedPassword 
 * @returns {Promise<boolean>} 
 */
const comparePassword = async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
};

module.exports = {
    hashPassword,
    comparePassword
};