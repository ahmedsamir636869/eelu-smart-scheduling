const { verifyAccessToken } = require('../utils/jwt.js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const isAuthenticated = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: user.id,
      roles: user.roles, 
      email: user.email,
    };

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Authorization Middleware - Admin Only
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!req.user.roles || !req.user.roles.includes('ADMIN')) {
    return res.status(403).json({ 
      message: 'Access denied. Admin privileges required.' 
    });
  }

  next();
};

/**
 * Authorization Middleware - Instructor or Admin
 */
const isInstructorOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const hasPermission = req.user.roles && (
    req.user.roles.includes('ADMIN') || 
    req.user.roles.includes('INSTRUCTOR')
  );

  if (!hasPermission) {
    return res.status(403).json({ 
      message: 'Access denied. Instructor or Admin privileges required.' 
    });
  }

  next();
};

/**
 * Authorization Middleware - Instructor Only
 */
const isInstructor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!req.user.roles || !req.user.roles.includes('INSTRUCTOR')) {
    return res.status(403).json({ 
      message: 'Access denied. Instructor privileges required.' 
    });
  }

  next();
};

/**
 * Authorization Middleware - TA Only
 */
const isTA = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!req.user.roles || !req.user.roles.includes('TA')) {
    return res.status(403).json({ 
      message: 'Access denied. TA privileges required.' 
    });
  }

  next();
};

/**
 * Authorization Middleware - Check if user owns the resource or is Admin
 */
const isOwnerOrAdmin = (paramName = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const resourceUserId = req.params[paramName];
    const isOwner = req.user.id === resourceUserId;
    const isAdmin = req.user.roles && req.user.roles.includes('ADMIN');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        message: 'Access denied. You can only access your own resources.' 
      });
    }

    next();
  };
};

module.exports = { 
  isAuthenticated, 
  isAdmin, 
  isInstructor,
  isInstructorOrAdmin,
  isTA,
  isOwnerOrAdmin
};
