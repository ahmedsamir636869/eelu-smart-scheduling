const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_EXPIRATION = '7d';

/**
 * @param {object} user 
 * @returns {{accessToken: string, refreshToken: string}}
 */
const generateTokens = (user) => {
const payload = {
    userId: user.id,
    role: user.role,
};

const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRATION,
});

const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRATION }
);

    return { accessToken, refreshToken };
};

/**
 * @param {string} token 
 * @returns {object | null} 
 */
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * @param {string} token 
 * @returns {object} 
 * @throws {Error} 
 */
const verifyRefreshToken = (token) => {
    return jwt.verify(token, JWT_REFRESH_SECRET);
};

module.exports = {
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken
};