const logger = require('../utils/logger');

/**
 * Role-based access control middleware
 * Checks if user has required role(s) to access route
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(`Unauthorized access attempt by user ${req.user._id} with role ${req.user.role}`);
        
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
          requiredRoles: allowedRoles,
          userRole: req.user.role
        });
      }

      next();
    } catch (error) {
      logger.error('RBAC middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
};

/**
 * Check if user is admin
 */
const requireAdmin = requireRole('admin');

/**
 * Check if user is customer or admin
 */
const requireCustomer = requireRole('customer', 'admin');

/**
 * Check if user owns the resource or is admin
 */
const requireOwnershipOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Admin can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      // Check ownership - resourceUserId can be in params, body, or query
      const resourceUserId = req.params[resourceUserIdField] || 
                            req.body[resourceUserIdField] || 
                            req.query[resourceUserIdField];

      if (!resourceUserId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ownership cannot be determined'
        });
      }

      // Compare user ID with resource owner ID
      if (req.user._id.toString() !== resourceUserId.toString()) {
        logger.warn(`User ${req.user._id} attempted to access resource owned by ${resourceUserId}`);
        
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.'
        });
      }

      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
};

module.exports = {
  requireRole,
  requireAdmin,
  requireCustomer,
  requireOwnershipOrAdmin
};
